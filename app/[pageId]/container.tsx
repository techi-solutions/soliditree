"use client";

import React, { useEffect, useRef, useState } from "react";
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
import {
  ContractPagesDonate,
  ContractPagesDestroyPage,
  ContractPagesReserveName,
  ContractPagesGetReservedName,
  ContractPagesCalculateReservationCost,
} from "@/services/contractPages/client";
import { formatArg } from "@/utils/formatting";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEther } from "viem";
import debounce from "debounce";
import { Badge } from "@/components/ui/badge";

export default function Container({
  pageId,
  usesReservedName,
  owner,
  contractOwner,
  contractData,
  network,
  destroyPage,
  shortNameThreshold,
}: {
  pageId: string;
  usesReservedName: boolean;
  owner: string;
  contractOwner: string;
  contractData: ContractPage;
  network: Network;
  destroyPage: (page: ContractPage) => Promise<void>;
  shortNameThreshold: number;
}) {
  const { address } = useAccount();
  const isOwner = address === owner;
  const isContractOwner = address === contractOwner;

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
    | "idle"
    | "approval"
    | "requesting"
    | "creating"
    | "success"
    | "error"
    | "insufficient funds"
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

  const [destroyStatus, setDestroyStatus] = useState<
    "idle" | "approval" | "destroying" | "success" | "error"
  >("idle");

  const handleDestroyPage = async () => {
    try {
      setDestroyStatus("approval");
      await ContractPagesDestroyPage(pageId, () => {
        setDestroyStatus("destroying");
      });
      await destroyPage(contractData);
      setDestroyStatus("success");
      router.push("/"); // Redirect to home page after successful deletion
    } catch (error) {
      console.error("Error destroying page:", error);
      setDestroyStatus("error");

      setTimeout(() => {
        setDestroyStatus("idle");
      }, 1000);
    }
  };

  const [isReserveNameSheetOpen, setIsReserveNameSheetOpen] = useState(false);
  const [reserveName, setReserveName] = useState("");
  const [reserveDuration, setReserveDuration] = useState("1");
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameCost, setNameCost] = useState<string | null>(null);

  const calculateCost = async (
    name: string,
    duration: string,
    available: boolean
  ) => {
    console.log("calculateCost", name, duration, available);
    if (name && !isCheckingName && available) {
      try {
        const cost = await ContractPagesCalculateReservationCost(
          parseInt(duration),
          name
        );
        console.log("cost", cost);
        setNameCost(formatEther(cost));
      } catch (error) {
        console.error("Error calculating reservation cost:", error);
        setNameCost(null);
      }
    } else {
      setNameCost(null);
    }
  };

  const checkNameAvailability = async (name: string, duration: string) => {
    console.log("checkNameAvailability", name, duration);
    if (name) {
      try {
        const isReserved = await ContractPagesGetReservedName(name);
        console.log("isReserved", isReserved);
        setIsNameAvailable(!isReserved);

        if (!isReserved) {
          await calculateCost(name, duration, !isReserved);
        } else {
          setNameCost(null);
        }
      } catch (error) {
        console.error("Error checking name availability:", error);
        setIsNameAvailable(null);
        setNameCost(null);
      } finally {
        setIsCheckingName(false);
      }
    } else {
      setIsNameAvailable(null);
      setNameCost(null);
      setIsCheckingName(false);
    }
  };

  const debouncedCheckNameAvailability = useRef(
    debounce(checkNameAvailability, 500)
  ).current;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleNameChange", e.target.value);
    if (!isCheckingName) {
      setIsCheckingName(true);
    }
    const name = e.target.value;
    setReserveName(name);
    debouncedCheckNameAvailability(name, reserveDuration);
  };

  const handleDurationChange = (value: string) => {
    setReserveDuration(value);
    calculateCost(reserveName, value, !!isNameAvailable);
  };

  const handleReserveName = async () => {
    try {
      setTxStatus("approval");
      const durationInMonths = parseInt(reserveDuration);
      const cost = await ContractPagesCalculateReservationCost(
        durationInMonths,
        reserveName
      );
      const ethAmount = formatEther(cost);

      await ContractPagesReserveName(
        pageId,
        reserveName,
        durationInMonths,
        () => {
          setTxStatus("creating");
        },
        isContractOwner ? undefined : ethAmount
      );

      setTxStatus("success");
      setIsReserveNameSheetOpen(false);

      router.push(`/${reserveName}`);
    } catch (error) {
      console.error("Error reserving name:", error);
      if (
        error instanceof Error &&
        error.message.includes("insufficient funds for transfer")
      ) {
        setTxStatus("insufficient funds");
      } else {
        setTxStatus("error");
      }
      setTimeout(() => {
        setTxStatus("idle");
      }, 2000);
    }
  };

  const isPremium =
    reserveName.length > 0 &&
    shortNameThreshold !== null &&
    reserveName.length <= shortNameThreshold;

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
          <Sheet
            open={isReserveNameSheetOpen}
            onOpenChange={setIsReserveNameSheetOpen}
          >
            <SheetTrigger asChild>
              <Button className="bg-white text-black">
                {!usesReservedName ? (
                  <>
                    Reserve page name (ex: /usdc, /eth){" "}
                    <StarIcon className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Release page name{" "}
                    <StarFilledIcon className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side={isPortrait ? "top" : "bottom"}
              className="flex flex-col items-center text-white"
            >
              <SheetHeader>
                <SheetTitle>Reserve Page Name</SheetTitle>
                <SheetDescription>
                  Enter a name and select duration to reserve
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 w-full max-w-xs">
                <div>
                  <Label htmlFor="reserve-name">Name</Label>
                  <div className="relative">
                    <Input
                      id="reserve-name"
                      value={reserveName}
                      onChange={handleNameChange}
                      placeholder="Enter name"
                    />
                    {isCheckingName && (
                      <Loader2 className="absolute right-2 top-3 h-4 w-4 animate-spin" />
                    )}
                    {!isCheckingName && isPremium && (
                      <Badge
                        className="absolute right-2 top-2"
                        variant="secondary"
                      >
                        premium
                      </Badge>
                    )}
                  </div>

                  {isNameAvailable === false && !isCheckingName && (
                    <p className="text-red-500">Name is already taken</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="reserve-duration">Duration</Label>
                  <Select
                    value={reserveDuration}
                    onValueChange={handleDurationChange}
                  >
                    <SelectTrigger id="reserve-duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 month</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleReserveName}
                  disabled={
                    txStatus !== "idle" || !isNameAvailable || isCheckingName
                  }
                >
                  {txStatus === "idle" ? (
                    !!nameCost && !isContractOwner ? (
                      `Reserve Name (${nameCost} ${network.symbol})`
                    ) : (
                      "Reserve Name"
                    )
                  ) : (
                    <>
                      {txStatus === "approval"
                        ? "Approve in wallet"
                        : txStatus === "creating"
                        ? "Reserving..."
                        : txStatus === "success"
                        ? "Reserved!"
                        : txStatus === "insufficient funds"
                        ? "Insufficient funds"
                        : "Error"}
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    </>
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              onClick={handleDestroyPage}
              disabled={destroyStatus !== "idle"}
            >
              {destroyStatus === "idle" ? (
                <>
                  Delete <TrashIcon className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  {destroyStatus === "approval"
                    ? "Approve in wallet"
                    : destroyStatus === "destroying"
                    ? "Destroying..."
                    : destroyStatus === "success"
                    ? "Destroyed!"
                    : "Error"}
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                </>
              )}
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
