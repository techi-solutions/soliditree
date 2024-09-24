"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Circle,
  ExternalLink,
  ScrollTextIcon,
  Pencil,
  ImageIcon,
  Loader2,
  Trash2Icon,
  PlusIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useChainId } from "wagmi";
import { Network } from "@/constants/networks";
import {
  DragHandleHorizontalIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { AbiTextStyle, ExtendedAbi, ExtendedAbiItem } from "@/services/scan";
import Image from "next/image";
import { ContractPagesCreatePage } from "@/services/contractPages/client";
import { Progress } from "@/components/ui/progress";
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
import { ContractPageColors } from "@/services/contractPages";
import ColorPickerInput from "@/components/ColorPickerInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { abiTextStyleClasses } from "@/services/scan";

const chains = [
  { id: 137, name: "Polygon", icon: "/assets/chains/polygon.png" },
  { id: 8453, name: "Base", icon: "/assets/chains/base.png" },
  { id: 10, name: "Optimism", icon: "/assets/chains/optimism.png" },
  { id: 100, name: "Gnosis Chain", icon: "/assets/chains/gnosis.png" },
  { id: 42220, name: "Celo", icon: "/assets/chains/celo.png" },
];

const formSchema = z.object({
  title: z.string().min(1, "Your page needs a title").default("My Page"),
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

export type CreatePageFormData = z.infer<typeof formSchema>;

export default function Container({
  chainId,
  network,
  contractAddress,
  exists,
  abi,
  createPage,
}: {
  chainId: number;
  network: Network;
  contractAddress: string;
  exists: boolean;
  abi: ExtendedAbi;
  createPage: (
    formData: FormData,
    functions: ExtendedAbi,
    colors: ContractPageColors
  ) => Promise<string>;
}) {
  const selectedChainId = useChainId();
  const allFunctions: ExtendedAbi = abi ?? [];
  const [functions, setFunctions] = useState<ExtendedAbi>([...allFunctions]);

  const linkNameRef = useRef<HTMLInputElement>(null);
  const linkUrlRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconObjectUrl, setIconObjectUrl] = useState<string | null>(null);

  const backgroundImageRef = useRef<HTMLInputElement>(null);
  const [backgroundObjectUrl, setBackgroundObjectUrl] = useState<string | null>(
    null
  );

  const disableChainSwitchingRef = useRef(false);

  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [creationStatus, setCreationStatus] = useState<
    "idle" | "approval" | "uploading" | "creating" | "success" | "error"
  >("idle");

  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const [colors, setColors] = useState({
    background: "#10b77f",
    card: "#10b77f",
    cardText: "#FFFFFF",
    button: "#489587",
    buttonText: "#FFFFFF",
  });

  useEffect(() => {
    if (
      !disableChainSwitchingRef.current &&
      selectedChainId !== chainId &&
      chains.some((chain) => chain.id === selectedChainId)
    ) {
      router.replace(`/new/${contractAddress}?chainId=${selectedChainId}`);
    }
  }, [selectedChainId, chainId, router, contractAddress]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreatePageFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colors: colors,
    },
  });

  const onSubmit = async (data: CreatePageFormData) => {
    disableChainSwitchingRef.current = true;
    const formData = new FormData();

    // Append form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    // Append the icon file if it exists
    if (
      fileInputRef.current &&
      fileInputRef.current.files &&
      fileInputRef.current.files[0]
    ) {
      formData.append("icon", fileInputRef.current.files[0]);
    }

    // Append the background image file if it exists
    if (
      backgroundImageRef.current &&
      backgroundImageRef.current.files &&
      backgroundImageRef.current.files[0]
    ) {
      formData.append("backgroundImage", backgroundImageRef.current.files[0]);
    }

    try {
      const selectedFunctions = functions.filter((func) => func.selected);
      console.log("selectedFunctions", selectedFunctions);
      if (selectedFunctions.length === 0) {
        throw new Error("No functions selected");
      }

      setCreationStatus("uploading");

      const hash = await createPage(formData, selectedFunctions, colors);

      setCreationStatus("approval");

      const pageId = await ContractPagesCreatePage(
        contractAddress,
        `ipfs://${hash}`,
        (txHash) => {
          setPendingTxHash(txHash);
          setCreationStatus("creating");
        }
      );
      console.log("pageId", pageId);
      setCreationStatus("success");
      const pageAddress = `${process.env.NEXT_PUBLIC_PAGE_URL}/${pageId}`;
      console.log("pageAddress", pageAddress);

      // Wait for 1 second before navigating
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push(pageAddress);
      return;
    } catch (error) {
      console.error("Error creating page:", error);
      setCreationStatus("error");
      setPendingTxHash(null);
      disableChainSwitchingRef.current = false;
      return;
      // Handle error (e.g., show error message to user)
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = iconObjectUrl;

    const file = event.target.files?.[0];
    if (file) {
      setIconObjectUrl(URL.createObjectURL(file));
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIconObjectUrl(null);
    }

    if (url) {
      URL.revokeObjectURL(url);
    }
  };

  const handleBackgroundImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const url = backgroundObjectUrl;

    const file = event.target.files?.[0];
    if (file) {
      setBackgroundObjectUrl(URL.createObjectURL(file));
    } else {
      if (backgroundImageRef.current) {
        backgroundImageRef.current.value = "";
      }
      setBackgroundObjectUrl(null);
    }

    if (url) {
      URL.revokeObjectURL(url);
    }
  };

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

  const handleInspectContract = () => {
    if (!exists) {
      return;
    }

    // open new tab in block explorer
    window.open(`${network.explorer}/address/${contractAddress}`, "_blank");
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
      setOpenPopoverId(null); // Close the popover
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

  const supportedChain = chains.some((chain) => chain.id === selectedChainId);

  const canCreatePage =
    exists &&
    functions.filter((func) => func.selected).length > 0 &&
    !errors.title &&
    !errors.description;

  return (
    <div className="container mx-auto p-4 space-y-6 text-black max-w-3xl relative pb-20 bg-white rounded-xl">
      <h1 className="text-2xl font-bold mb-4">New Contract Page</h1>

      <div className="space-y-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <Label htmlFor="chain" className="text-xl text-bold">
              Chain
            </Label>
            <Button className="rounded-full p-0 h-auto w-auto">
              <w3m-network-button />
            </Button>
          </div>
          {!supportedChain && (
            <div className="text-red-500">
              Unsupported chain. Please select a supported chain.
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="contractAddress" className="text-xl text-bold">
            Contract Address
          </Label>
          <div
            className={cn(
              "flex items-center space-x-2 h-10",
              exists ? "cursor-pointer" : ""
            )}
            onClick={handleInspectContract}
          >
            <div
              className={cn(
                "flex-grow flex items-center justify-between space-x-2 border rounded-full pr-2",
                exists ? "border-accent" : "border-gray-300"
              )}
            >
              <div className="flex items-center space-x-2 ">
                {exists ? (
                  <ScrollTextIcon className="h-8 w-8 text-accent p-2" />
                ) : (
                  <QuestionMarkCircledIcon className="h-8 w-8 text-accent p-1" />
                )}
                <p className="py-1">{contractAddress}</p>
              </div>
              {!exists ? (
                <div className="flex items-center space-x-2">
                  <p className="text-accent text-sm italic">
                    Could not find contract on {network.name}
                  </p>
                </div>
              ) : (
                <div>
                  <ExternalLink className="h-6 w-6 text-accent p-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {exists && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              className="text-input"
              defaultValue="My Page"
            />
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
            <Label htmlFor="icon">Icon (optional)</Label>
            <div className="relative">
              <Input
                id="icon"
                type="file"
                accept=".png,.jpg,.jpeg"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="pl-8 text-input file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 file:cursor-pointer"
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
                {iconObjectUrl ? (
                  <Image
                    src={iconObjectUrl}
                    alt="Icon"
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
            {errors.icon && (
              <p className="text-red-500">{errors.icon.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="website">Website Link (optional)</Label>
            <Input
              id="website"
              {...register("website")}
              className="text-input"
            />
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
                className="pl-8 text-input file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 file:cursor-pointer"
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
                <ColorPickerInput
                  name="background"
                  label="Background Color"
                  register={register}
                  colors={colors}
                  setColors={setColors}
                  setValue={setValue}
                  errors={errors}
                />
                <ColorPickerInput
                  name="card"
                  label="Card Color"
                  register={register}
                  colors={colors}
                  setColors={setColors}
                  setValue={setValue}
                  errors={errors}
                />
                <ColorPickerInput
                  name="cardText"
                  label="Card Text Color"
                  register={register}
                  colors={colors}
                  setColors={setColors}
                  setValue={setValue}
                  errors={errors}
                />
                <ColorPickerInput
                  name="button"
                  label="Button Color"
                  register={register}
                  colors={colors}
                  setColors={setColors}
                  setValue={setValue}
                  errors={errors}
                />
                <ColorPickerInput
                  name="buttonText"
                  label="Button Text Color"
                  register={register}
                  colors={colors}
                  setColors={setColors}
                  setValue={setValue}
                  errors={errors}
                />
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

          <div className="z-50 fixed bottom-0 left-0 right-0 bg-white p-4 shadow-md">
            <div className="flex flex-col items-center justify-between container mx-auto max-w-2xl">
              {(creationStatus === "idle" || creationStatus === "error") && (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canCreatePage}
                >
                  Create Page
                </Button>
              )}
              {creationStatus === "uploading" ||
              creationStatus === "approval" ||
              creationStatus === "creating" ||
              creationStatus === "success" ? (
                <div className="w-full flex flex-col items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {creationStatus === "uploading"
                      ? "Uploading page content ⏳"
                      : creationStatus === "approval"
                      ? "Requesting to sign transaction 🔑"
                      : creationStatus === "creating"
                      ? "Publishing page 🚀"
                      : "Page created 🎉"}
                  </p>
                  <div className="w-full flex items-center justify-center">
                    <Progress
                      value={
                        creationStatus === "uploading"
                          ? 25
                          : creationStatus === "approval"
                          ? 50
                          : creationStatus === "creating"
                          ? 75
                          : creationStatus === "success"
                          ? 100
                          : 0
                      }
                    />
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </div>
                </div>
              ) : null}
              {pendingTxHash && (
                <Button onClick={handlePendingTxExplorer}>
                  View on Explorer <ExternalLinkIcon className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </form>
      )}

      {exists && allFunctions.length > 0 && (
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
                  {functions.map((func, index) => (
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
                                {func.text && (
                                  <div
                                    className={cn(
                                      "text-black",
                                      abiTextStyleClasses[
                                        func.text.style || "h1"
                                      ]
                                    )}
                                  >
                                    {func.text.text}
                                  </div>
                                )}
                                {func.separator && (
                                  <div
                                    className="w-full"
                                    style={{
                                      borderTop: `${func.separator.width}px ${func.separator.style} ${func.separator.color}`,
                                    }}
                                  />
                                )}
                                {!func.text && !func.separator && func.name}
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
                                      {func.text && (
                                        <>
                                          <h4 className="font-medium">
                                            Edit Text
                                          </h4>
                                          <Input
                                            defaultValue={func.text.text}
                                            className="text-input"
                                            onChange={(e) => {
                                              handleEditText(
                                                func.id,
                                                e.currentTarget.value,
                                                func.text?.style || "h1"
                                              );
                                            }}
                                          />
                                          <Select
                                            defaultValue={
                                              func.text.style || "h1"
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
                                      {func.separator && (
                                        <>
                                          <h4 className="font-medium">
                                            Edit Separator
                                          </h4>
                                          <Select
                                            defaultValue={
                                              func.separator.style || "solid"
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
                                              func.separator.color || "#000000"
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
                                                func.separator.width || 1,
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
                                      {!func.text && !func.separator && (
                                        <>
                                          <h4 className="font-medium">
                                            Edit Function Name
                                          </h4>
                                          <Input
                                            defaultValue={func.name}
                                            className="text-input"
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
                            {(func.link || func.text || func.separator) && (
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
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}
