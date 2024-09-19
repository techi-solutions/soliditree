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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContractPage, ContractPageColors } from "@/services/contractPages";
import { useAccount } from "wagmi";
import {
  ExternalLinkIcon,
  EyeIcon,
  GitPullRequestCreateArrow,
  Loader2,
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

export default function Container({
  contractData,
  network,
}: {
  contractData: ContractPage;
  network: Network;
}) {
  const { address } = useAccount();

  // Fix for a development mode bug where UI is rendered on the server with missing values
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  console.log("contractData", contractData);

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
      setTxStatus("creating");

      const receipt = await ContractWriteFunction(
        contractData.contractAddress,
        func.name,
        func.inputs.map((input) => functionArgs[func.id]?.[input.name!] || ""),
        [func],
        () => {
          setTxStatus("creating");
        },
        func.stateMutability === "payable"
          ? functionArgs[func.id]?.value || "0"
          : undefined
      );

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
      const result = await ContractReadFunction(
        contractData.contractAddress,
        func.name,
        func.inputs.map((input) => functionArgs[func.id]?.[input.name!] || ""),
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

  const handleOpen = (func: ExtendedAbiItem) => {
    if (func.stateMutability === "view" && func.inputs.length === 0) {
      handleSubmitReadableTx(func);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setTxHash(null);
    setTxStatus("idle");
  };

  const handleClose = () => {
    setResult(null);
    setTxHash(null);
    setTxStatus("idle");
    setFunctionArgs({});
  };

  return (
    <div
      className="w-full flex justify-center items-start min-h-screen sm:p-4 sm:items-center"
      style={{
        backgroundColor: colors.background,
        backgroundImage: contractData.backgroundImage
          ? `url(${contractData.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card
        className="max-w-xl mx-auto w-full border-transparent"
        style={{ backgroundColor: colors.card, color: colors.cardText }}
      >
        <CardHeader className="text-center relative">
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
          <div className="absolute top-0 right-2 rounded-full overflow-hidden">
            <w3m-button balance="hide" size="md" />
          </div>
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
          {contractData.functions.map((func) => {
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
                <Drawer
                  onOpenChange={(open) => !open && handleClose()}
                  onClose={handleClose}
                >
                  <DrawerTrigger asChild>
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
                  </DrawerTrigger>
                  <DrawerContent className="flex flex-col items-center">
                    <DrawerHeader className="max-w-xl w-full justify-center">
                      <DrawerTitle className="text-white text-center">
                        {func.name}
                      </DrawerTitle>
                      <DrawerDescription className="text-center">
                        {func.id}
                      </DrawerDescription>
                    </DrawerHeader>
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
                    <DrawerFooter className="flex justify-center max-w-xl w-full">
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
                          <DrawerClose asChild>
                            <Button variant="outline" className="text-white">
                              Cancel
                            </Button>
                          </DrawerClose>
                        </>
                      ) : (
                        <div className="min-h-20 w-full flex flex-col items-center justify-center">
                          {!!result && (
                            <div className="w-full flex flex-col items-center justify-center gap-2 animate-fade-in">
                              <p className="text-white">{`${result}`}</p>
                              <Button
                                className="w-full"
                                onClick={() => {
                                  handleRetry();
                                  writeable
                                    ? handleSubmitWriteableTx(func)
                                    : handleSubmitReadableTx(func);
                                }}
                              >
                                {writeable ? "Send Again" : "Request Again"}
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
                                View on Explorer
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
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
