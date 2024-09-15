"use client";

import { useState, useRef } from "react";
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
} from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Smile } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useChainId } from "wagmi";
import ContractPagesABI from "@/abi/ContractPages.abi.json";

const chains = [
  { id: 1, name: "Ethereum", icon: "/assets/chains/ethereum.png" },
  { id: 137, name: "Polygon", icon: "/assets/chains/polygon.png" },
  { id: 8453, name: "Base", icon: "/assets/chains/base.png" },
  { id: 10, name: "Optimism", icon: "/assets/chains/optimism.png" },
  { id: 100, name: "Gnosis Chain", icon: "/assets/chains/gnosis.png" },
  { id: 42220, name: "Celo", icon: "/assets/chains/celo.png" },
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.instanceof(File).optional(),
  website: z.string().url().optional(),
});

export type CreatePageFormData = z.infer<typeof formSchema>;

export default function NewContractPage({
  contractAddress,
  abi,
  createPage,
}: {
  contractAddress: string;
  abi: typeof ContractPagesABI.abi;
  createPage: (formData: FormData) => Promise<string>;
}) {
  console.log("abi", abi);
  const chainId = useChainId();
  const [functions, setFunctions] = useState(
    abi.filter((v) => v.type === "function")
  );
  //   const [generatedPageAddress, setGeneratedPageAddress] = useState("");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);

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
      const hash = await createPage(formData);
      console.log("hash", hash);
      const pageAddress = `${process.env.NEXT_PUBLIC_PAGE_URL}/${contractAddress}`;
      router.push(
        `/new/${contractAddress}/success?pageAddress=${encodeURIComponent(
          pageAddress
        )}`
      );
    } catch (error) {
      console.error("Error creating page:", error);
      // Handle error (e.g., show error message to user)
    }
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

  //   const toggleFunctionVisibility = (id: string) => {
  //     setFunctions(
  //       functions.map((func) =>
  //         func.id === id ? { ...func, visible: !func.visible } : func
  //       )
  //     );
  //   };

  //   const handleCreate = async () => {
  //     // Placeholder function to generate page address
  //     await createPage({ hello: "world" });

  //     console.log("Creating page for", contractAddress);
  //     const pageAddress = `${process.env.NEXT_PUBLIC_PAGE_URL}/${contractAddress}`; // TODO: use generated page address
  //     router.push(
  //       `/new/${contractAddress}/success?pageAddress=${encodeURIComponent(
  //         pageAddress
  //       )}`
  //     );
  //   };

  // Update chainId when the network changes
  //   useEffect(() => {
  //     if (chainId) {
  //       setChainId(chainId.toString());
  //     }
  //   }, [chainId]);

  console.log("chainId", chainId);
  console.log("contractAddress", contractAddress);

  const supportedChain = chains.some((chain) => chain.id === chainId);

  return (
    <div className="container mx-auto p-4 space-y-6 text-black max-w-3xl">
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
          <div className="flex space-x-2">
            <p className="p-2 rounded-md flex-grow">{contractAddress}</p>
            {/* <Button onClick={fetchABI}>Fetch ABI</Button> */}
          </div>
        </div>
      </div>

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
          <Input
            id="icon"
            type="file"
            accept=".svg"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          {errors.icon && <p className="text-red-500">{errors.icon.message}</p>}
        </div>

        <div>
          <Label htmlFor="website">Website Link (optional)</Label>
          <Input id="website" {...register("website")} />
          {errors.website && (
            <p className="text-red-500">{errors.website.message}</p>
          )}
        </div>

        <Button type="submit" className="mt-4">
          Create Page
        </Button>
      </form>

      <div>
        <h2 className="text-xl font-semibold mb-2">Functions</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="functions">
            {(provided: DroppableProvided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {functions.map((func, index) => (
                  <Draggable
                    key={func.name}
                    draggableId={func.name ?? `${index}`}
                    index={index}
                  >
                    {(provided: DraggableProvided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between p-2 bg-gray-100 text-black rounded"
                      >
                        <span>{func.name}</span>
                        <div className="space-x-2">
                          {/* <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleFunctionVisibility(func.id)}
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            {func.visible ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button> */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            <Image
                              src="/path/to/image.svg"
                              alt="Icon"
                              width={20}
                              height={20}
                              className="h-4 w-4"
                            />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* {generatedPageAddress && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Generated Page Address:</h2>
          <a
            href={generatedPageAddress}
            className="text-blue-500 hover:underline"
          >
            {generatedPageAddress}
          </a>
        </div>
      )} */}
    </div>
  );
}
