"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useChainId } from "wagmi";
import { Network } from "@/constants/networks";
import {
  DragHandleHorizontalIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { ExtendedAbi } from "@/services/scan";
import Image from "next/image";
import { ContractPagesCreatePage } from "@/services/contractPages/client";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
});

export type CreatePageFormData = z.infer<typeof formSchema>;

export default function NewContractPage({
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
  createPage: (formData: FormData, functions: ExtendedAbi) => Promise<string>;
}) {
  const selectedChainId = useChainId();
  const allFunctions: ExtendedAbi = abi ?? [];
  const [functions, setFunctions] = useState<ExtendedAbi>([...allFunctions]);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);

  const [creationStatus, setCreationStatus] = useState<
    "idle" | "approval" | "uploading" | "creating" | "success" | "error"
  >("idle");

  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedChainId !== chainId) {
      router.replace(`/new/${contractAddress}?chainId=${selectedChainId}`);
    }
  }, [selectedChainId, chainId, router, contractAddress]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePageFormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: CreatePageFormData) => {
    const formData = new FormData();

    // Append form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    // Append the file if it exists
    if (iconFile) {
      formData.append("icon", iconFile);
    }

    try {
      const selectedFunctions = functions.filter((func) => func.selected);
      console.log("selectedFunctions", selectedFunctions);
      if (selectedFunctions.length === 0) {
        throw new Error("No functions selected");
      }

      setCreationStatus("uploading");

      const hash = await createPage(formData, selectedFunctions);
      console.log("hash", hash);

      setCreationStatus("approval");

      const pageId = await ContractPagesCreatePage(
        contractAddress,
        `ipfs://${hash}`,
        () => setCreationStatus("creating")
      );
      console.log("pageId", pageId);
      setCreationStatus("success");
      const pageAddress = `${process.env.NEXT_PUBLIC_PAGE_URL}/${pageId}`;
      console.log("pageAddress", pageAddress);

      router.push(
        `/new/${contractAddress}/success?pageAddress=${encodeURIComponent(
          pageAddress
        )}`
      );
      return;
    } catch (error) {
      console.error("Error creating page:", error);
      setCreationStatus("error");
      return;
      // Handle error (e.g., show error message to user)
    }
    setCreationStatus("idle");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      setIconFile(file);
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIconFile(null);
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

  console.log("chainId", chainId);
  console.log("contractAddress", contractAddress);
  console.log("network", network);
  console.log(allFunctions);

  const supportedChain = chains.some((chain) => chain.id === chain.id);

  const canCreatePage =
    exists &&
    functions.filter((func) => func.selected).length > 0 &&
    !errors.title &&
    !errors.description;

  return (
    <div className="container mx-auto p-4 space-y-6 text-black max-w-3xl relative pb-20">
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
            <Label htmlFor="icon">Icon (SVG only) (optional)</Label>
            <div className="relative">
              <Input
                id="icon"
                type="file"
                accept=".svg"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="pl-8 text-input"
                style={{ paddingTop: 5 }}
              />
              <div className="absolute" style={{ top: 2, left: 2 }}>
                {iconFile ? (
                  <Image
                    src={URL.createObjectURL(iconFile)}
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

          <div className="z-50 fixed bottom-0 left-0 right-0 bg-white p-4 shadow-md">
            <div className="flex items-center justify-between container mx-auto max-w-2xl">
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
            </div>
          </div>
        </form>
      )}

      {exists && allFunctions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold mb-2">Functions</h2>
            <Button onClick={handleToggleSelectAll}>Select All</Button>
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
                                {func.name}
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
                          <div className="space-x-2">
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
