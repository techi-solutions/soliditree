"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContractPage, ContractPageColors } from "@/services/contractPages";
import { useAccount } from "wagmi";
import {
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  GitPullRequestCreateArrow,
  HeartIcon,
  Loader2,
  PencilIcon,
  ShareIcon,
  StarIcon,
  TrashIcon,
} from "lucide-react"; // Import the Wallet icon
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Network } from "@/constants/networks";
import { ExtendedAbiItem } from "@/services/scan";
import {
  ContractReadFunction,
  ContractWriteFunction,
} from "@/services/contracts/client";
import { Progress } from "@/components/ui/progress";
import { hexToRgb } from "@/utils/colors";
import { cn } from "@/lib/utils";
import { useIsPortrait } from "@/hooks/screen";
import { HeartFilledIcon, StarFilledIcon } from "@radix-ui/react-icons";
import { ContractPagesDonate } from "@/services/contractPages/client";
import { formatArg } from "@/utils/formatting";
import { useRouter } from "next/navigation";

export default function Container({
  pageId,
  usesReservedName,
  owner,
  contractData,
  network,
}: {
  pageId: string;
  usesReservedName: boolean;
  owner: string;
  contractData: ContractPage;
  network: Network;
}) {
  const { address } = useAccount();
  const isOwner = address === owner;

  const [isCopied, setIsCopied] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState<{ [key: string]: boolean }>(
    {}
  );

  const isPortrait = useIsPortrait();

  // Fix for a development mode bug where UI is rendered on the server with missing values
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const colors: ContractPageColors = contractData.colors ?? {
    background: "#10b77f",
    card: "#10b77f",
    cardText: "#FFFFFF",
    button: "#489587",
    buttonText: "#FFFFFF",
  };

  const [txStatus, setTxStatus] = useState<
    "idle" | "approval" | "requesting" | "creating" | "success" | "error"
  >("idle");

  const [donateValue, setDonateValue] = useState<string>("0");

  const [txHash, setTxHash] = useState<string | null>(null);
  const [result, setResult] = useState<unknown | null>(null);

  const [functionArgs, setFunctionArgs] = useState<{
    [key: string]: { [key: string]: string };
  }>({});

  const handleArgChange = (funcId: string, argName: string, value: string) => {
    setFunctionArgs((prev) => ({
      ...prev,
      [funcId]: { ...prev[funcId], [argName]: value },
    }));
  };

  const handleSubmitWriteableTx = async (func: ExtendedAbiItem) => {
    try {
      setTxStatus("approval");

      const formattedArgs = func.inputs.map((input) =>
        formatArg(input.type, functionArgs[func.id]?.[input.name!] || "")
      );

      const receipt = await ContractWriteFunction(
        network,
        contractData.contractAddress,
        func.name,
        formattedArgs,
        [func],
        () => {
          setTxStatus("creating");
        },
        func.stateMutability === "payable"
          ? functionArgs[func.id]?.value || "0"
          : undefined
      );
      if (!receipt) {
        throw new Error("Transaction failed");
      }

      setTxStatus("success");
      setTxHash(receipt.transactionHash);
    } catch (error) {
      console.error(error);
      setTxStatus("error");
    }
  };

  const handleSubmitReadableTx = async (func: ExtendedAbiItem) => {
    try {
      setTxStatus("requesting");

      const formattedArgs = func.inputs.map((input) =>
        formatArg(input.type, functionArgs[func.id]?.[input.name!] || "")
      );

      const result = await ContractReadFunction(
        network,
        contractData.contractAddress,
        func.name,
        formattedArgs,
        [func]
      );
      setTxStatus("success");
      setTimeout(() => {
        setResult(result);
      }, 100);
    } catch (error) {
      console.error(error);
      setTxStatus("error");
    }
  };

  const handleDonate = async () => {
    try {
      setTxStatus("approval");

      const receipt = await ContractPagesDonate(donateValue, () => {
        setTxStatus("creating");
      });
      if (!receipt) {
        throw new Error("Transaction failed");
      }

      setTxStatus("success");
      setTxHash(receipt.transactionHash);
    } catch (error) {
      console.error(error);
      setTxStatus("error");
    }
  };

  const handleOpen = (func: ExtendedAbiItem) => {
    setIsSheetOpen({ [func.id]: true });
    if (func.stateMutability === "view" && func.inputs.length === 0) {
      handleSubmitReadableTx(func);
    }
  };

  const handleRetry = () => {
    setTxHash(null);
    setTxStatus("idle");
  };

  const handleClose = (nextState: boolean) => {
    console.log("nextState", nextState);
    setIsSheetOpen({});
    if (nextState) {
      return;
    }

    setResult(null);
    setTxHash(null);
    setTxStatus("idle");
    setFunctionArgs({});
  };

  const handleShareLink = async () => {
    const url = window.location.href;

    const shareData: ShareData = {
      title: contractData.title,
      text: contractData.description,
      url: url,
    };

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share({
          title: contractData.title,
          text: contractData.description,
          url: url,
        });
        return;
      } catch (error) {
        console.error("Error sharing:", error);
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await navigator.clipboard.writeText(url);

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  const router = useRouter();

  const handleEditPage = () => {
    router.push(`/edit/${pageId}`);
  };

  return (
    <div className="relative w-full flex justify-center items-start min-h-screen sm:p-4 sm:items-center">
      {contractData.backgroundImage && (
        <div
          className="fixed top-0 left-0 w-full h-full z-[-1]"
          style={{
            backgroundImage: `url(${contractData.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      {isOwner && (
        <div className="fixed top-0 left-0 w-full flex justify-between items-center space-x-2 px-6 py-2 z-50">
          {!usesReservedName ? (
            <Button className="bg-white text-black">
              Set page name <StarFilledIcon className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button className="bg-white text-black">
              Release page name <StarIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Button variant="destructive">
              Delete <TrashIcon className="h-4 w-4 ml-2" />
            </Button>
            <Button onClick={handleEditPage}>
              Edit <PencilIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
      <div className="fixed bottom-2 right-2 space-x-2 z-50">
        <Link
          href={`${network.explorer}/address/${contractData.contractAddress}`}
          target="_blank"
        >
          <Button variant="outline" className="text-white">
            View on Explorer <ExternalLinkIcon className="h-4 w-4 ml-2" />
          </Button>
        </Link>
        <Sheet>
          <SheetTrigger>
            <Button className="bg-white text-black">
              Donate{" "}
              <HeartFilledIcon className="h-4 w-4 ml-2 text-red-500 animate-pulse" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side={isPortrait ? "top" : "bottom"}
            className="flex flex-col items-center text-white"
          >
            <div className="max-w-xl w-full flex flex-col items-center justify-center text-white">
              {!!txHash ? (
                <HeartFilledIcon className="h-4 w-4 ml-2 text-red-500 animate-pulse" />
              ) : (
                <HeartIcon className="h-4 w-4 ml-2 text-red-500 animate-pulse" />
              )}
              <p>{!!txHash ? "Donation received! 🎉" : "Donate to the page"}</p>
              <div className="flex flex-col gap-2 justify-center max-w-xl w-full space-y-2">
                {txStatus === "idle" || txStatus === "error" ? (
                  <>
                    <Label htmlFor={`donate-value`} className="text-white">
                      Value (in {network.symbol})
                    </Label>
                    <Input
                      id={`donate-value`}
                      className="text-white"
                      autoFocus
                      type="number"
                      step="0.000000000000000001"
                      min="0"
                      placeholder="0.0"
                      value={donateValue}
                      onChange={(e) => setDonateValue(e.target.value)}
                    />
                    <Button onClick={handleDonate}>Donate</Button>
                  </>
                ) : (
                  <div className="min-h-20 max-w-xl w-full flex flex-col items-center justify-center">
                    {!!txHash && (
                      <Link
                        className="animate-fade-in text-white"
                        target="_blank"
                        href={`${network.explorer}/tx/${txHash}`}
                      >
                        <Button className="w-full">
                          View on Explorer{" "}
                          <ExternalLinkIcon className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                    {!txHash && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {txStatus === "approval"
                            ? "Requesting to sign transaction 🔑"
                            : txStatus === "creating"
                            ? "Submitted 🚀"
                            : txStatus === "success"
                            ? "Successful 🎉"
                            : txStatus === "requesting"
                            ? "Requesting data 🔍"
                            : "Failed ❌"}
                        </p>
                        <div className="w-full flex items-center justify-center">
                          <Progress
                            className="w-full text-white"
                            value={
                              txStatus === "approval" ||
                              txStatus === "requesting"
                                ? 33
                                : txStatus === "creating"
                                ? 66
                                : txStatus === "success"
                                ? 100
                                : 0
                            }
                          />
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card
        className={cn(
          "max-w-xl mx-auto w-full border-transparent",
          isOwner ? "m-10" : "m-2"
        )}
        style={{
          backgroundColor: contractData.backgroundImage
            ? `rgba(${hexToRgb(colors.card)}, 0.8)`
            : colors.background,
          color: colors.cardText,
        }}
      >
        <CardHeader className="text-center relative">
          <div
            className={cn(
              "absolute top-2 right-2 rounded-full overflow-hidden",
              address ? "bg-white py-1" : "bg-white p-1"
            )}
          >
            <w3m-button balance="hide" size="md" />
          </div>
          <div className="absolute top-1 left-2 rounded-full overflow-hidden">
            <Button variant="outline" onClick={handleShareLink}>
              {isCopied ? (
                <>
                  Copied! <CheckIcon className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Share page <ShareIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <Avatar className="w-24 h-24 mx-auto mt-4 mb-4">
            <AvatarImage src={contractData.icon} alt={contractData.title} />
            <AvatarFallback>{contractData.title.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-white" style={{ color: colors.cardText }}>
            {contractData.title}
          </CardTitle>
          <CardDescription
            className="text-white"
            style={{ color: colors.cardText }}
          >
            {contractData.description}
          </CardDescription>

          {contractData.website && (
            <Link
              href={contractData.website}
              className="flex items-center justify-center"
            >
              <div className="flex items-center mt-2">
                {contractData.website}
                <ExternalLinkIcon className="h-4 w-4 ml-2" />
              </div>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {contractData.functions.map((func, index) => {
            const writeable =
              func.stateMutability === "payable" ||
              func.stateMutability === "nonpayable";

            if (func.link) {
              return (
                <Link key={func.id} href={func.link.url}>
                  <Button
                    className="w-full mb-4 flex justify-between items-center"
                    style={{
                      backgroundColor: colors.button,
                      color: colors.buttonText,
                    }}
                  >
                    <span>{func.name}</span>
                    <ExternalLinkIcon className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              );
            }

            return (
              <div key={func.id} className="mb-4">
                <Sheet onOpenChange={handleClose} open={isSheetOpen[func.id]}>
                  <SheetTrigger asChild>
                    <Button
                      className="w-full mb-2 flex justify-between items-center"
                      style={{
                        backgroundColor: colors.button,
                        color: colors.buttonText,
                      }}
                      disabled={isClient && writeable && !address}
                      onClick={() => handleOpen(func)}
                    >
                      <span>{func.name}</span>
                      {writeable ? (
                        <GitPullRequestCreateArrow className="h-4 w-4 ml-2" />
                      ) : (
                        <EyeIcon className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side={isPortrait ? "top" : "bottom"}
                    className="flex flex-col items-center text-white"
                  >
                    <SheetHeader className="max-w-xl w-full justify-center">
                      <SheetTitle className="text-white text-center">
                        {func.name}
                      </SheetTitle>
                      <SheetDescription className="text-center">
                        {func.id}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="p-4 max-w-xl w-full">
                      {func.stateMutability === "payable" && (
                        <div className="mt-2">
                          <Label
                            htmlFor={`${func.id}-value`}
                            className="text-white"
                          >
                            Value (in {network.symbol})
                          </Label>
                          <Input
                            id={`${func.id}-value`}
                            className="text-white"
                            autoFocus={index === 0}
                            type="number"
                            step="0.000000000000000001"
                            min="0"
                            placeholder="0.0"
                            value={functionArgs[func.id]?.value || ""}
                            onChange={(e) =>
                              func.id &&
                              handleArgChange(func.id, "value", e.target.value)
                            }
                          />
                        </div>
                      )}
                      {func.inputs
                        .filter((input) => input.name !== undefined)
                        .map((input) => (
                          <div key={input.name} className="mt-2">
                            <Label
                              htmlFor={`${func.id}-${input.name}`}
                              className="text-white"
                            >
                              {input.name}
                            </Label>
                            <Input
                              id={`${func.id}-${input.name}`}
                              type="text"
                              autoFocus={index === 0}
                              className="text-white"
                              placeholder={input.type}
                              value={functionArgs[func.id]?.[input.name!] || ""}
                              onChange={(e) =>
                                func.id &&
                                handleArgChange(
                                  func.id,
                                  input.name!,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2 justify-center max-w-xl w-full">
                      {txStatus === "idle" || txStatus === "error" ? (
                        <>
                          <Button
                            onClick={() =>
                              writeable
                                ? handleSubmitWriteableTx(func)
                                : handleSubmitReadableTx(func)
                            }
                          >
                            {writeable ? "Send Transaction" : "Request Data"}
                          </Button>
                        </>
                      ) : (
                        <div className="min-h-20 max-w-xl w-full flex flex-col items-center justify-center">
                          {!!result && (
                            <div className="max-w-xl w-full flex flex-col items-center justify-center gap-2 animate-fade-in overflow-x-hidden">
                              <Label className="text-white">Result</Label>
                              <p className="text-black break-words whitespace-normal overflow-y-auto w-full p-2 bg-white rounded-md">
                                {`${result}`}
                              </p>
                              <Button
                                className="w-full"
                                onClick={() => {
                                  handleRetry();
                                  writeable
                                    ? handleSubmitWriteableTx(func)
                                    : handleSubmitReadableTx(func);
                                }}
                              >
                                {writeable ? "Send Again" : "Request Again"}{" "}
                                {txStatus === "requesting" && (
                                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                )}
                              </Button>
                            </div>
                          )}
                          {!!txHash && (
                            <Link
                              className="animate-fade-in text-white"
                              target="_blank"
                              href={`${network.explorer}/tx/${txHash}`}
                            >
                              <Button className="w-full">
                                View on Explorer{" "}
                                <ExternalLinkIcon className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                          )}
                          {!result && !txHash && (
                            <>
                              <p className="text-sm text-muted-foreground">
                                {txStatus === "approval"
                                  ? "Requesting to sign transaction 🔑"
                                  : txStatus === "creating"
                                  ? "Submitted 🚀"
                                  : txStatus === "success"
                                  ? "Successful 🎉"
                                  : txStatus === "requesting"
                                  ? "Requesting data 🔍"
                                  : "Failed ❌"}
                              </p>
                              <div className="w-full flex items-center justify-center">
                                <Progress
                                  className="text-white"
                                  value={
                                    txStatus === "approval" ||
                                    txStatus === "requesting"
                                      ? 33
                                      : txStatus === "creating"
                                      ? 66
                                      : txStatus === "success"
                                      ? 100
                                      : 0
                                  }
                                />
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
