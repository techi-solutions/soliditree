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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Globe, Smile } from "lucide-react";
import Image from "next/image";

interface ContractFunction {
  id: string;
  name: string;
  visible: boolean;
}

export default function NewContractPage() {
  const [chainId, setChainId] = useState("1");
  const [contractAddress, setContractAddress] = useState("");
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [functions, setFunctions] = useState<ContractFunction[]>([]);
  const [generatedPageAddress, setGeneratedPageAddress] = useState("");

  //   const handleChainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //     setChainId(event.target.value);
  //   };

  const handleContractAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContractAddress(event.target.value);
  };

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
    // In a real implementation, this would make an API call to create the page
    console.log("Creating page for", contractAddress);
    setGeneratedPageAddress(`https://example.com/contracts/${contractAddress}`);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 bg-white text-black max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">New Contract Page</h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="chain">Chain</Label>
          <Select value={chainId} onValueChange={setChainId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">
                <div className="flex items-center">
                  <Image
                    src="/assets/chains/ethereum.png"
                    alt="Ethereum logo"
                    width={20}
                    height={20}
                    className="mr-2 rounded-full"
                  />
                  Ethereum
                </div>
              </SelectItem>
              <SelectItem value="137">
                <div className="flex items-center">
                  <Image
                    src="/assets/chains/polygon.png"
                    alt="Polygon logo"
                    width={20}
                    height={20}
                    className="mr-2 rounded-full"
                  />
                  Polygon
                </div>
              </SelectItem>
              <SelectItem value="8453">
                <div className="flex items-center">
                  <Image
                    src="/assets/chains/base.png"
                    alt="Base logo"
                    width={20}
                    height={20}
                    className="mr-2 rounded-full"
                  />
                  Base
                </div>
              </SelectItem>
              <SelectItem value="10">
                <div className="flex items-center">
                  <Image
                    src="/assets/chains/optimism.png"
                    alt="Optimism logo"
                    width={20}
                    height={20}
                    className="mr-2 rounded-full"
                  />
                  Optimism
                </div>
              </SelectItem>
              <SelectItem value="100">
                <div className="flex items-center">
                  <Image
                    src="/assets/chains/gnosis.png"
                    alt="Gnosis Chain logo"
                    width={20}
                    height={20}
                    className="mr-2 rounded-full"
                  />
                  Gnosis Chain
                </div>
              </SelectItem>
              <SelectItem value="42220">
                <div className="flex items-center">
                  <Image
                    src="/assets/chains/celo.png"
                    alt="Celo logo"
                    width={20}
                    height={20}
                    className="mr-2 rounded-full"
                  />
                  Celo
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contractAddress">Contract Address</Label>
          <div className="flex space-x-2">
            <Input
              id="contractAddress"
              value={contractAddress}
              onChange={handleContractAddressChange}
              placeholder="0x..."
            />
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
                        className="flex items-center justify-between p-2 bg-gray-100 rounded"
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

      {generatedPageAddress && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Generated Page Address:</h2>
          <a
            href={generatedPageAddress}
            className="text-blue-500 hover:underline"
          >
            {generatedPageAddress}
          </a>
        </div>
      )}
    </div>
  );
}
