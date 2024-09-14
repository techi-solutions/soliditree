"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronUp, Globe, Smile } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useChainId } from "wagmi";

interface ContractFunction {
  id: string;
  name: string;
  visible: boolean;
}

const chains = [
  { id: 1, name: "Ethereum", icon: "/assets/chains/ethereum.png" },
  { id: 137, name: "Polygon", icon: "/assets/chains/polygon.png" },
  { id: 8453, name: "Base", icon: "/assets/chains/base.png" },
  { id: 10, name: "Optimism", icon: "/assets/chains/optimism.png" },
  { id: 100, name: "Gnosis Chain", icon: "/assets/chains/gnosis.png" },
  { id: 42220, name: "Celo", icon: "/assets/chains/celo.png" },
];

export default function NewContractPage({
  contractAddress,
}: {
  contractAddress: string;
}) {
  const chainId = useChainId();
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [functions, setFunctions] = useState<ContractFunction[]>([]);
  //   const [generatedPageAddress, setGeneratedPageAddress] = useState("");
  const router = useRouter();

  //   const handleChainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //     setChainId(event.target.value);
  //   };

  const fetchABI = async () => {
    // Placeholder function to fetch ABI
    // In a real implementation, this would make an API call to fetch the ABI
    console.log("Fetching ABI for", contractAddress);
    // Simulating ABI fetch
    setFunctions([
      { id: "1", name: "transfer", visible: true },
      { id: "2", name: "balanceOf", visible: true },
      { id: "3", name: "approve", visible: true },
    ]);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(functions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFunctions(items);
  };

  const toggleFunctionVisibility = (id: string) => {
    setFunctions(
      functions.map((func) =>
        func.id === id ? { ...func, visible: !func.visible } : func
      )
    );
  };

  const handleCreate = () => {
    // Placeholder function to generate page address
    console.log("Creating page for", contractAddress);
    const pageAddress = `${process.env.NEXT_PUBLIC_PAGE_URL}/${contractAddress}`; // TODO: use generated page address
    router.push(
      `/new/${contractAddress}/success?pageAddress=${encodeURIComponent(
        pageAddress
      )}`
    );
  };

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
            <Button onClick={fetchABI}>Fetch ABI</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Customization</h2>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="icon">Icon (favicon)</Label>
          <Input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="websiteLink">Website Link</Label>
          <Input
            id="websiteLink"
            value={websiteLink}
            onChange={(e) => setWebsiteLink(e.target.value)}
          />
        </div>
      </div>

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
                  <Draggable key={func.id} draggableId={func.id} index={index}>
                    {(provided: DraggableProvided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between p-2 bg-gray-100 text-black rounded"
                      >
                        <span>{func.name}</span>
                        <div className="space-x-2">
                          <Button
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
                          </Button>
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

      <Button onClick={handleCreate} className="mt-4">
        Create Page
      </Button>

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
