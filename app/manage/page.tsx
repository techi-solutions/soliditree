"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon } from "lucide-react";
import { useAccount } from "wagmi";

// interface Page {
//   id: string;
//   name: string;
//   description: string;
// }

export default function ManagePage() {
  const { address, chainId } = useAccount();

  const [contractAddress, setContractAddress] = useState("");
  const [isValidContract, setIsValidContract] = useState(false);
  const [debouncedValidContract] = useDebounce(isValidContract, 300);

  //   const [existingPages, setExistingPages] = useState<Page[]>([
  //     { id: "1", name: "Page 1", description: "This is the first page" },
  //     { id: "2", name: "Page 2", description: "This is the second page" },
  //     { id: "3", name: "Page 3", description: "This is the third page" },
  //     { id: "4", name: "Page 4", description: "This is the fourth page" },
  //     { id: "5", name: "Page 5", description: "This is the fifth page" },
  //     { id: "6", name: "Page 6", description: "This is the sixth page" },
  //     { id: "7", name: "Page 7", description: "This is the seventh page" },
  //     { id: "8", name: "Page 8", description: "This is the eighth page" },
  //     { id: "9", name: "Page 9", description: "This is the ninth page" },
  //     { id: "10", name: "Page 10", description: "This is the tenth page" },
  //   ]);

  const handleContractAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContractAddress(e.target.value);
    // Debounce the validation check
    setIsValidContract(true); // 300ms delay
  };

  //   const handleDeletePage = (page: Page) => {
  //     setExistingPages((prevPages) => prevPages.filter((p) => p.id !== page.id));
  //     // setPageToDelete(null);
  //   };

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <div className="max-w-2xl text-center">
          <w3m-button
            disabled={!!address}
            balance="hide"
            size="md"
            label="Sign in 🚀"
            loadingLabel="Signing in ⏳"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen container mx-auto p-4 space-y-6 text-black max-w-3xl relative pb-20 text-white">
      <div className="max-w-4xl text-center">
        <div className="mb-6 relative h-20 w-full">
          <Link href="/" className="absolute top-0 left-0 mt-4 ml-4">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="mt-8 animate-fade-in-slow">
          <h3 className="text-2xl font-bold mb-4">Create a new page</h3>
          <Input
            type="text"
            placeholder="Enter contract address"
            className="w-full text-lg"
            onChange={handleContractAddressChange}
            value={contractAddress}
          />
          {debouncedValidContract && (
            <Link href={`/new/${contractAddress}?chainId=${chainId}`}>
              <Button className="mt-4 animate-fade-in">Create Page</Button>
            </Link>
          )}
        </div>
        <Separator className="my-8 animate-fade-in-slow" />

        <div className="mt-8 animate-fade-in-slow">
          <h3 className="text-2xl font-bold mb-4">Existing Pages</h3>
          <div className="flex flex-col space-y-4">
            <p>coming soon...</p>
            {/* {existingPages.map((page) => (
              <div key={page.id} className="flex items-center space-x-2">
                <Link href={`/${page.id}/edit`} className="flex-grow">
                  <div className="p-4 bg-white text-black rounded-md">
                    <h4 className="text-lg font-bold">{page.name}</h4>
                    <p className="text-sm text-gray-500">
                      {page.description || "No description provided"}
                    </p>
                  </div>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white text-black">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePage(page)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))} */}
          </div>
        </div>
      </div>
    </div>
  );
}
