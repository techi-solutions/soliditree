"use client";

import { useState, useRef, useCallback, MouseEvent } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { ContractPage, ContractPageColors } from "@/services/contractPages";
import { Progress } from "@/components/ui/progress";
import { Loader2, ImageIcon, ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import ColorPickerInput from "@/components/ColorPickerInput";
import {
  AbiTextStyle,
  abiTextStyleClasses,
  ExtendedAbi,
  ExtendedAbiItem,
} from "@/services/scan";
import { ContractPagesUpdatePageContentHash } from "@/services/contractPages/client";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DropResult,
} from "@hello-pangea/dnd";
import {
  CheckCircle,
  Circle,
  Pencil,
  Trash2Icon,
  PlusIcon,
} from "lucide-react";
import { DragHandleHorizontalIcon } from "@radix-ui/react-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { generateRandomString } from "@/utils/random";
import { keccak256, stringToBytes } from "viem";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Network } from "@/constants/networks";

const formSchema = z.object({
  title: z.string().min(1, "Your page needs a title"),
  description: z.string().min(1, "Provide a short description of your page"),
  icon: z.instanceof(File).optional(),
  website: z.union([z.string().url(), z.string().length(0)]).optional(),
  backgroundImage: z.instanceof(File).optional(),
  colors: z.object({
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    card: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    cardText: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    button: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
    buttonText: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  }),
});

type EditPageFormData = z.infer<typeof formSchema>;

export default function Container({
  pageId,
  network,
  resolvedPageId,
  contractPage,
  editPage,
  unpinOldContent,
}: {
  pageId: string;
  resolvedPageId: string;
  network: Network;
  contractPage: ContractPage;
  editPage: (
    formData: FormData,
    functions: ExtendedAbi,
    colors: ContractPageColors
  ) => Promise<{ newHash: string; uploadData: ContractPage; oldHash: string }>;
  unpinOldContent: (
    oldHash: string,
    oldPage: ContractPage,
    newPage: ContractPage
  ) => Promise<void>;
}) {
  const router = useRouter();
  const [colors, setColors] = useState<ContractPageColors>(
    contractPage.colors || {
      background: "#10b77f",
      card: "#10b77f",
      cardText: "#FFFFFF",
      button: "#489587",
      buttonText: "#FFFFFF",
    }
  );
  const [iconObjectUrl, setIconObjectUrl] = useState<string | null>(
    contractPage.icon || null
  );
  const [backgroundObjectUrl, setBackgroundObjectUrl] = useState<string | null>(
    contractPage.backgroundImage || null
  );
  const [editStatus, setEditStatus] = useState<
    | "idle"
    | "uploading"
    | "approval"
    | "updating"
    | "unpinning"
    | "success"
    | "error"
  >("idle");
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);

  console.log(iconObjectUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EditPageFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: contractPage.title,
      description: contractPage.description,
      website: contractPage.website,
      colors: colors,
    },
  });

  const handleEditPage = useCallback(
    async (
      formData: FormData,
      functions: ExtendedAbi,
      colors: ContractPageColors
    ) => {
      return editPage(formData, functions, colors);
    },
    [editPage]
  );

  const handleUnpinOldContent = useCallback(
    async (oldHash: string, oldPage: ContractPage, newPage: ContractPage) => {
      return unpinOldContent(oldHash, oldPage, newPage);
    },
    [unpinOldContent]
  );

  const onSubmit = async (data: EditPageFormData) => {
    setEditStatus("uploading");
    try {
      const formData = new FormData();

      // Append form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "colors") {
          formData.append(key, value as string);
        }
      });

      // Append the icon file if it exists
      if (fileInputRef.current?.files?.[0]) {
        formData.append("icon", fileInputRef.current.files[0]);
      }

      // Append the background image file if it exists
      if (backgroundImageRef.current?.files?.[0]) {
        formData.append("backgroundImage", backgroundImageRef.current.files[0]);
      }

      // Use the updated functions
      const updatedFunctions = functions.filter((func) => func.selected);

      const { newHash, uploadData, oldHash } = await handleEditPage(
        formData,
        updatedFunctions,
        colors
      );
      console.log("New IPFS hash:", newHash);

      // Update the page content hash in the smart contract
      setEditStatus("approval");
      await ContractPagesUpdatePageContentHash(
        resolvedPageId,
        `ipfs://${newHash}`,
        (txHash) => {
          setEditStatus("updating");
          setPendingTxHash(txHash);
        }
      );

      setEditStatus("unpinning");
      // Unpin old content after successful update
      await handleUnpinOldContent(oldHash, contractPage, uploadData);

      console.log("pageId", pageId);

      setEditStatus("success");
      router.push(`/${pageId}`);
    } catch (error) {
      console.error("Error updating page:", error);
      setEditStatus("error");
      setPendingTxHash(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      setIconObjectUrl(URL.createObjectURL(file));
      event.target.setAttribute("data-file-name", file.name);
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.removeAttribute("data-file-name");
      }
      setIconObjectUrl(null);
    }
  };

  const handleBackgroundImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackgroundObjectUrl(URL.createObjectURL(file));
      event.target.setAttribute("data-file-name", file.name);
    } else {
      if (backgroundImageRef.current) {
        backgroundImageRef.current.value = "";
        backgroundImageRef.current.removeAttribute("data-file-name");
      }
      setBackgroundObjectUrl(null);
    }
  };

  const [functions, setFunctions] = useState<ExtendedAbi>(
    contractPage.functions || []
  );
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const linkNameRef = useRef<HTMLInputElement>(null);
  const linkUrlRef = useRef<HTMLInputElement>(null);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(functions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFunctions(items);
  };

  const handleToggleSelected = (id: string) => {
    setFunctions(
      functions.map((func) =>
        func.id === id ? { ...func, selected: !func.selected } : func
      )
    );
  };

  const handleToggleSelectAll = () => {
    const selected = functions.every((func) => func.selected);
    setFunctions(functions.map((func) => ({ ...func, selected: !selected })));
  };

  const handleEditFunctionName = (
    id: string,
    newName: string,
    close = true
  ) => {
    if (!newName) {
      return;
    }
    setFunctions(
      functions.map((func) =>
        func.id === id ? { ...func, name: newName } : func
      )
    );
    if (close) {
      setOpenPopoverId(null);
    }
  };

  const handleAddLink = (name: string, url: string) => {
    const link: ExtendedAbiItem = {
      id: `link(${url}) (${generateRandomString(4)})`,
      signature: keccak256(stringToBytes(`link(${url})`)),
      name,
      link: {
        url,
      },
      selected: true,
      type: "function",
      inputs: [],
      outputs: [],
      stateMutability: "view",
    };
    setFunctions([link, ...functions]);
  };

  const handleAddText = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const group: ExtendedAbiItem = {
      id: `text(${generateRandomString(4)})`,
      signature: keccak256(stringToBytes(`text(${generateRandomString(4)})`)),
      name: "Text",
      text: {
        style: "h1",
        text: "New Text",
      },
      selected: true,
      type: "function",
      inputs: [],
      outputs: [],
      stateMutability: "view",
    };
    setFunctions([group, ...functions]);
  };

  const handleAddSeparator = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const separator: ExtendedAbiItem = {
      id: `separator(${generateRandomString(4)})`,
      signature: keccak256(
        stringToBytes(`separator(${generateRandomString(4)})`)
      ),
      name: "Separator",
      separator: {
        style: "solid",
        color: "#000000",
        width: 1,
      },
      selected: true,
      type: "function",
      inputs: [],
      outputs: [],
      stateMutability: "view",
    };
    setFunctions([separator, ...functions]);
  };

  const handleDeleteFunction = (id: string) => {
    setFunctions(functions.filter((func) => func.id !== id));
  };

  const handleEditText = (id: string, newText: string, newStyle: string) => {
    setFunctions(
      functions.map((func) =>
        func.id === id
          ? {
              ...func,
              text: {
                ...func.text,
                text: newText,
                style: newStyle as AbiTextStyle,
              },
            }
          : func
      )
    );
  };

  const handleEditSeparator = (
    id: string,
    newStyle: string,
    newColor: string,
    newWidth: number
  ) => {
    setFunctions(
      functions.map((func) =>
        func.id === id
          ? {
              ...func,
              separator: {
                style: newStyle as "solid" | "dashed" | "dotted",
                color: newColor,
                width: newWidth,
              },
            }
          : func
      )
    );
  };

  const handlePendingTxExplorer = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!pendingTxHash || typeof window === "undefined") {
      return;
    }
    window.open(`${network.explorer}/tx/${pendingTxHash}`, "_blank");
  };

  return (
    <div className="container mx-auto p-4 space-y-6 text-black max-w-3xl relative pb-20 bg-white rounded-xl">
      <h1 className="text-2xl font-bold mb-4">Edit Contract Page</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} />
          {errors.title && (
            <p className="text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
          {errors.description && (
            <p className="text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="icon">Icon (SVG only) (optional)</Label>
          <div className="relative">
            <Input
              id="icon"
              type="file"
              accept=".svg"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="pl-8 text-white file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 file:cursor-pointer"
              style={{ paddingTop: 5 }}
            />
            <div className="absolute" style={{ top: 2, left: 2 }}>
              {iconObjectUrl ? (
                <Image
                  src={iconObjectUrl}
                  alt="Icon"
                  width={24}
                  height={24}
                  className="ml-1"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
          {errors.icon && <p className="text-red-500">{errors.icon.message}</p>}
        </div>

        <div>
          <Label htmlFor="website">Website Link (optional)</Label>
          <Input id="website" {...register("website")} />
          {errors.website && (
            <p className="text-red-500">{errors.website.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="backgroundImage">Background Image (optional)</Label>
          <div className="relative">
            <Input
              id="backgroundImage"
              type="file"
              accept=".png,.jpg,.jpeg"
              ref={backgroundImageRef}
              onChange={handleBackgroundImageChange}
              className="pl-8 text-white file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 file:cursor-pointer"
              style={{ paddingTop: 5 }}
            />
            <div
              className="absolute flex items-center justify-center overflow-hidden rounded-sm"
              style={{
                top: 4,
                left: 4,
                width: 28,
                height: 28,
              }}
            >
              {backgroundObjectUrl ? (
                <Image
                  src={backgroundObjectUrl}
                  alt="Background image"
                  width={28}
                  height={28}
                  objectFit="cover"
                  objectPosition="center"
                  className="h-full w-full overflow-hidden object-cover object-center"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
          {errors.backgroundImage && (
            <p className="text-red-500">{errors.backgroundImage.message}</p>
          )}
        </div>

        <div className="w-full space-y-4 flex flex-col">
          <h3 className="text-lg font-semibold">Color Settings</h3>
          <div className="flex space-x-4">
            <div className="flex flex-col space-y-2">
              {Object.keys(colors).map((colorKey) => (
                <ColorPickerInput
                  key={colorKey}
                  name={colorKey as keyof ContractPageColors}
                  label={`${
                    colorKey.charAt(0).toUpperCase() + colorKey.slice(1)
                  } Color`}
                  register={register}
                  colors={colors}
                  setColors={setColors}
                  setValue={setValue}
                  errors={errors}
                />
              ))}
            </div>
            <div
              className="flex flex-1 rounded-sm"
              style={{
                backgroundColor: colors.background,
                backgroundImage: backgroundObjectUrl
                  ? `url(${backgroundObjectUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="flex flex-1 flex-col justify-center items-center">
                <div
                  className="flex flex-col justify-start items-center rounded-xl h-60 w-40 p-4"
                  style={{ backgroundColor: colors.card }}
                >
                  <p style={{ color: colors.cardText }}>Title</p>
                  <p style={{ color: colors.cardText }}>Description</p>
                  <div className="flex flex-1 w-full flex-col mt-4 space-y-2">
                    <Button
                      className="w-full"
                      style={{
                        backgroundColor: colors.button,
                        color: colors.buttonText,
                      }}
                    >
                      Button
                    </Button>
                    <Button
                      className="w-full"
                      style={{
                        backgroundColor: colors.button,
                        color: colors.buttonText,
                      }}
                    >
                      Button
                    </Button>
                    <Button
                      className="w-full"
                      style={{
                        backgroundColor: colors.button,
                        color: colors.buttonText,
                      }}
                    >
                      Button
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold mb-2">Functions</h2>
            <div className="flex space-x-2">
              <Button onClick={handleAddText}>
                Add Text <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
              <Button onClick={handleAddSeparator}>
                Add Separator <PlusIcon className="h-4 w-4 ml-2" />
              </Button>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button>
                    Add Link <PlusIcon className="h-4 w-4 ml-2" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Add Link</DrawerTitle>
                    <DrawerDescription>
                      Create a new link for your contract page.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkName">Link Name</Label>
                      <Input
                        id="linkName"
                        placeholder="Enter link name"
                        className="text-white"
                        ref={linkNameRef}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkUrl">URL</Label>
                      <Input
                        id="linkUrl"
                        placeholder="Enter URL"
                        ref={linkUrlRef}
                        className="text-white"
                      />
                    </div>
                    <DrawerClose asChild>
                      <Button
                        onClick={() => {
                          const linkName = linkNameRef.current?.value || "";
                          const linkUrl = linkUrlRef.current?.value || "";
                          handleAddLink(linkName, linkUrl);
                        }}
                        className="w-full"
                      >
                        Create Link
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerContent>
              </Drawer>
              <Button onClick={handleToggleSelectAll}>Select All</Button>
            </div>
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="functions">
              {(provided: DroppableProvided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {functions.map((func, index) => {
                    let rowType = "function";
                    if (func.text) {
                      rowType = "text";
                    } else if (func.separator) {
                      rowType = "separator";
                    } else if (func.link) {
                      rowType = "link";
                    }
                    return (
                      <Draggable
                        key={func.id}
                        draggableId={func.id}
                        index={index}
                      >
                        {(provided: DraggableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "flex items-center justify-between p-2 rounded",
                              func.selected
                                ? "bg-gray-100 text-black border border-accent"
                                : "bg-gray-50 text-black/70 border border-gray-300"
                            )}
                          >
                            <div className="flex items-center flex-grow space-x-2">
                              <div>
                                <DragHandleHorizontalIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col">
                                <span className="flex items-center">
                                  {(rowType === "function" ||
                                    rowType === "link") &&
                                    func.name}
                                  {rowType === "text" && (
                                    <div
                                      className={cn(
                                        "text-black",
                                        abiTextStyleClasses[
                                          func.text?.style || "h1"
                                        ]
                                      )}
                                    >
                                      {func.text?.text}
                                    </div>
                                  )}
                                  {rowType === "separator" && (
                                    <div
                                      className="w-full"
                                      style={{
                                        borderTop: `${func.separator?.width}px ${func.separator?.style} ${func.separator?.color}`,
                                      }}
                                    />
                                  )}
                                  <Popover
                                    open={openPopoverId === func.id}
                                    onOpenChange={(open) =>
                                      setOpenPopoverId(open ? func.id : null)
                                    }
                                  >
                                    <PopoverTrigger asChild>
                                      <Pencil className="h-4 w-4 ml-2 text-muted-foreground cursor-pointer hover:text-black" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                      <div className="space-y-2">
                                        {rowType === "function" && (
                                          <>
                                            <h4 className="font-medium">
                                              Edit Function Name
                                            </h4>
                                            <Input
                                              defaultValue={func.name}
                                              className="text-white"
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  handleEditFunctionName(
                                                    func.id,
                                                    e.currentTarget.value
                                                  );
                                                }
                                              }}
                                              onChange={(e) => {
                                                handleEditFunctionName(
                                                  func.id,
                                                  e.currentTarget.value,
                                                  false
                                                );
                                              }}
                                            />
                                          </>
                                        )}
                                        {rowType === "text" && (
                                          <>
                                            <h4 className="font-medium">
                                              Edit Text
                                            </h4>
                                            <Input
                                              defaultValue={
                                                func.text?.text || ""
                                              }
                                              className="text-white"
                                              onChange={(e) => {
                                                handleEditText(
                                                  func.id,
                                                  e.currentTarget.value,
                                                  func.text?.style || "normal"
                                                );
                                              }}
                                            />
                                            <Select
                                              defaultValue={
                                                func.text?.style || "normal"
                                              }
                                              onValueChange={(value) => {
                                                handleEditText(
                                                  func.id,
                                                  func.text?.text || "",
                                                  value
                                                );
                                              }}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select style" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="h1">
                                                  Heading 1
                                                </SelectItem>
                                                <SelectItem value="h2">
                                                  Heading 2
                                                </SelectItem>
                                                <SelectItem value="h3">
                                                  Heading 3
                                                </SelectItem>
                                                <SelectItem value="h4">
                                                  Heading 4
                                                </SelectItem>
                                                <SelectItem value="h5">
                                                  Heading 5
                                                </SelectItem>
                                                <SelectItem value="h6">
                                                  Heading 6
                                                </SelectItem>
                                                <SelectItem value="normal">
                                                  Normal
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </>
                                        )}
                                        {rowType === "separator" && (
                                          <>
                                            <h4 className="font-medium">
                                              Edit Separator
                                            </h4>
                                            <Select
                                              defaultValue={
                                                func.separator?.style || "solid"
                                              }
                                              onValueChange={(value) => {
                                                handleEditSeparator(
                                                  func.id,
                                                  value,
                                                  func.separator?.color ||
                                                    "#000000",
                                                  func.separator?.width || 1
                                                );
                                              }}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select style" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="solid">
                                                  Solid
                                                </SelectItem>
                                                <SelectItem value="dashed">
                                                  Dashed
                                                </SelectItem>
                                                <SelectItem value="dotted">
                                                  Dotted
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Input
                                              type="color"
                                              defaultValue={
                                                func.separator?.color ||
                                                "#000000"
                                              }
                                              onChange={(e) => {
                                                handleEditSeparator(
                                                  func.id,
                                                  func.separator?.style ||
                                                    "solid",
                                                  e.target.value,
                                                  func.separator?.width || 1
                                                );
                                              }}
                                            />
                                            <div className="space-y-2">
                                              <Label>Width</Label>
                                              <Slider
                                                defaultValue={[
                                                  func.separator?.width || 1,
                                                ]}
                                                max={10}
                                                step={1}
                                                onValueChange={(value) => {
                                                  handleEditSeparator(
                                                    func.id,
                                                    func.separator?.style ||
                                                      "solid",
                                                    func.separator?.color ||
                                                      "#000000",
                                                    value[0]
                                                  );
                                                }}
                                              />
                                            </div>
                                          </>
                                        )}
                                        <div className="flex justify-end">
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              setOpenPopoverId(null);
                                            }}
                                          >
                                            Close
                                          </Button>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {func.id}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {rowType !== "function" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteFunction(func.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              )}
                              <div
                                className={cn(
                                  "p-4 hover:bg-white hover:text-black rounded-full cursor-pointer",
                                  func.selected ? "text-black" : "text-black/70"
                                )}
                                onClick={() => handleToggleSelected(func.id)}
                              >
                                {func.selected ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between container mx-auto max-w-2xl">
            {editStatus === "idle" || editStatus === "error" ? (
              <Button type="submit" className="w-full">
                Update Page
              </Button>
            ) : (
              <div className="w-full flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {editStatus === "uploading"
                    ? "Uploading page content ⏳"
                    : editStatus === "approval"
                    ? "Approve transaction in your wallet"
                    : editStatus === "updating"
                    ? "Updating page content 🌐"
                    : editStatus === "unpinning"
                    ? "Cleaning up old content 🧹"
                    : editStatus === "success"
                    ? "Page updated 🎉"
                    : ""}
                </p>
                <div className="w-full flex items-center justify-center">
                  <Progress
                    value={
                      editStatus === "uploading"
                        ? 10
                        : editStatus === "approval"
                        ? 30
                        : editStatus === "updating"
                        ? 50
                        : editStatus === "unpinning"
                        ? 70
                        : editStatus === "success"
                        ? 100
                        : 0
                    }
                  />
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            {pendingTxHash && (
              <Button onClick={handlePendingTxExplorer}>
                View on Explorer <ExternalLinkIcon className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
