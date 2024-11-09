"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  useEstimateGas,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { tokenList } from "./tokenlist";
import { contractAddress } from "./config";
import ERC20ABI from "@/abi/ERC20.json";
import TokenMigrationABI from "@/abi/TokenMigration.json";

export default function Home() {
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { openChainModal } = useChainModal();
  const { address: walletAddress, chain, isConnected } = useAccount();

  const [isClient, setIsClient] = useState(false);
  const [isSuccessToast, setIsSuccessToast] = useState(false);
  const [isPendingToast, setIsPendingToast] = useState(false);
  const [isErrorToast, setIsErrorToast] = useState(false);
  const [isCopy, setIsCopy] = useState(false);
  const [isModalShow, setIsModalShow] = useState(false);
  const [selectedToken, setSelectedToken] = useState(tokenList[0].address);
  const [inputValue, setInputValue] = useState({
    formatted: "0",
    value: 0,
  });

  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { data: approveData } = useSimulateContract({
    abi: ERC20ABI,
    address: selectedToken as `0x${string}`,
    functionName: "approve",
    args: [contractAddress, inputValue.value ?? Number.MAX_SAFE_INTEGER],
  });
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: estimateApproveGas } = useEstimateGas(approveData);
  const {
    data: approveValue,
    refetch: allowanceFetch,
    isFetching: allowanceLoading,
  } = useReadContract({
    abi: ERC20ABI,
    address: selectedToken as `0x${string}`,
    functionName: "allowance",
    args: [walletAddress, contractAddress],
  });
  const {
    data: tokenBalance,
    isFetching: isBalanceLoading,
    refetch: balanceFetch,
  } = useBalance({
    address: walletAddress,
    token: selectedToken as `0x${string}`,
  });

  const activeToken = useMemo(() => {
    return (
      tokenList.find((token) => token.address === selectedToken) ?? tokenList[0]
    );
  }, [JSON.stringify(tokenList), selectedToken]);

  const selectedDecimal = useMemo(() => {
    return activeToken.decimal ?? 0;
  }, [activeToken]);

  const changeSelectedToken = (address: string) => {
    setSelectedToken(address);
    setIsModalShow(false);
  };

  const changeInputValue = (value: string) => {
    setInputValue({
      formatted: value,
      value: Number(value) * 10 ** selectedDecimal,
    });
  };

  const getFixedValue = (value: string | number) => {
    const value_ = value ? value.toString() : "0";
    const dividedValue = value_.split(".");
    const fixedValue = `${Number(dividedValue[0]).toLocaleString("en-US", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })}${dividedValue[1] ? "." + dividedValue[1].slice(0, 4) : ""}`;
    return fixedValue;
  };

  const setMax = () => {
    if (!tokenBalance) return;
    setInputValue({
      formatted: tokenBalance.formatted ?? "0",
      value: Number(tokenBalance.value) ?? 0,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    handleCopyToast();
  };

  const handleSuccessToast = () => {
    setIsSuccessToast(true);
    setTimeout(() => {
      setIsSuccessToast(false);
    }, 10000);
  };

  const handlePendingToast = () => {
    setIsPendingToast(true);
    setTimeout(() => {
      setIsPendingToast(false);
    }, 10000);
  };

  const handleErrorToast = () => {
    setIsErrorToast(true);
    setTimeout(() => {
      setIsErrorToast(false);
    }, 10000);
  };

  const handleCopyToast = () => {
    setIsCopy(true);
    setTimeout(() => {
      setIsCopy(false);
    }, 5000);
  };

  const handleApprove = async () => {
    if (!approveData) return;
    await writeContractAsync({
      ...approveData.request,
      gas: estimateApproveGas,
    })
      .then(() => {
        handlePendingToast();
      })
      .catch((err) => {
        console.log(err);
        handleErrorToast();
      });
  };

  const handleMigrate = async () => {
    await writeContractAsync({
      abi: TokenMigrationABI,
      address: contractAddress,
      functionName:
        selectedToken === tokenList[0].address ? "migrateA" : "migrateB",
      args: [BigInt(inputValue.value)],
    })
      .then(() => {
        handlePendingToast();
      })
      .catch((err) => {
        console.log(err);
        handleErrorToast();
      });
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isSuccess) {
      balanceFetch();
      allowanceFetch();
      handleSuccessToast();
    }
  }, [isSuccess]);

  return (
    isClient && (
      <main className={`m-0 flex flex-col justify-between min-h-screen gap-10`}>
        <header className="w-full h-24 md:h-20 bg-[#262D3A] shadow-md flex justify-center px-4">
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-center md:justify-between max-w-6xl gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <Image
                src={"/logo.png"}
                width={50}
                height={50}
                alt="logo"
                className="w-10 md:w-12 h-10 md:h-12"
                draggable={false}
              />
              <div className="text-xl md:text-2xl">Fintyh Coin (FTC)</div>
            </div>
            <div className="flex items-stretch md:items-center gap-1 md:gap-4">
              {openConnectModal && (
                <button
                  className="btn bg-primary hover:bg-secondary text-white border-secondary hover:border-primary"
                  onClick={openConnectModal}
                >
                  Connect Wallet
                </button>
              )}
              {openChainModal && (
                <button
                  onClick={openChainModal}
                  className="btn btn-outline btn-sm border-secondary hover:border-primary hover:bg-transparent text-secondary hover:text-primary"
                >
                  {chain?.name}
                </button>
              )}
              {openAccountModal && (
                <button
                  onClick={openAccountModal}
                  className="btn btn-sm bg-primary hover:bg-secondary text-white border-secondary hover:border-primary"
                >
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </button>
              )}
            </div>
          </div>
        </header>
        <section className="flex flex-col items-center gap-4 px-4">
          <div className="max-w-6xl w-full p-8 bg-[#262D3A] rounded-xl shadow-xl">
            <div className="text-3xl font-bold text-center text-secondary">
              Bridge de Conversão para FINTYH Coin (FTC)
            </div>
            <div className="mt-4 text-sm">
              Esta é a sua plataforma para converter tokens JEDALS e FTH para
              FINTYH Coin (FTC) na proporção de 1:1. Ao utilizar a bridge, cada
              unidade de JEDALS e FTH será trocada diretamente por uma unidade
              de FTC. Basta conectar sua wallet, selecionar a quantidade de
              tokens que deseja converter e confirmar a transação. Seus novos
              FTC estarão disponíveis em instantes na sua Wallet.
            </div>
          </div>
          <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-4">
            <div className="p-4 sm:p-8 w-full lg:w-1/2 bg-[#262D3A] rounded-xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="text-2xl font-bold text-center">Converter</div>
                <div className="dropdown w-full mt-4">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn w-full bg-[#191E24] justify-between"
                    onClick={() => setIsModalShow(true)}
                  >
                    <div className="join items-center gap-1">
                      <img
                        src={activeToken.logo}
                        width={27}
                        height={27}
                        alt="logo"
                        draggable={false}
                      />
                      {activeToken.name} ({activeToken.symbol})
                    </div>
                    <svg
                      className="w-4 h-4"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m19 9-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <ul
                    tabIndex={0}
                    className={`dropdown-content menu bg-base-100 rounded-box z-[1] mt-1 w-full shadow ${
                      isModalShow ? "block" : "hidden"
                    }`}
                  >
                    {tokenList.map((token) => (
                      <li
                        onClick={() => changeSelectedToken(token.address)}
                        key={token.address}
                      >
                        <div className="join items-center gap-1">
                          <img
                            src={token.logo}
                            width={27}
                            height={27}
                            alt="logo"
                            draggable={false}
                          />
                          {token.name} ({token.symbol})
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text text-slate-100">
                      Quantidade
                    </span>
                    <span className="label-text-alt flex items-center gap-2 text-slate-100">
                      Disponível:{" "}
                      {isBalanceLoading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        getFixedValue(tokenBalance?.formatted ?? "0")
                      )}
                    </span>
                  </div>
                  <label className="input bg-[#191E24] flex items-center gap-2 join">
                    <input
                      type="text"
                      className="grow"
                      placeholder=""
                      value={inputValue.formatted}
                      onChange={(e) => changeInputValue(e.target.value)}
                    />
                    <button
                      className="btn btn-ghost btn-sm text-primary"
                      onClick={setMax}
                    >
                      MAX
                    </button>
                  </label>
                </label>
              </div>
              <button
                className="btn w-full mt-4 bg-primary hover:bg-secondary border-primary hover:border-secondary text-white disabled:border-primary/20"
                disabled={
                  (isConnected &&
                    (!inputValue.value || inputValue.value === 0)) ||
                  isPending
                }
                onClick={
                  !isConnected
                    ? openConnectModal
                    : inputValue.value > Number(approveValue)
                    ? handleApprove
                    : handleMigrate
                }
              >
                {isPending && <span className="loading loading-ring"></span>}
                {!isConnected
                  ? "Connect Wallet"
                  : inputValue.value > Number(approveValue)
                  ? "Aprovar"
                  : "Converter"}
              </button>
            </div>
            <div className="p-8 w-full lg:w-1/2 bg-[#262D3A] rounded-xl shadow-xl">
              <div className="text-2xl font-bold text-center">
                Como Converter?
              </div>
              <ul className="list-decimal mt-4">
                <li className="mt-4 ml-4">Conecte sua Wallet</li>
                <li className="mt-4 ml-4">Selecione a quantidade de Tokens</li>
                <li className="mt-4 ml-4">Clique no botão Aprovar</li>
                <li className="mt-4 ml-4">Confirme aprovação na sua Wallet</li>
                <li className="mt-4 ml-4">Clique no botão Converter</li>
                <li className="mt-4 ml-4">
                  Confirme a conversão na sua wallet
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl w-full p-4 bg-[#262D3A] rounded-xl shadow-xl">
            <div className="text-center overflow-hidden text-pretty text-ellipsis text-sm sm:text-base">
              <b>Obs</b>: É necessário adicionar o contrato Fintyh Coin (FTC) na
              sua Wallet: 0xd385764e63101856c182727520ecfd2bc0abaed9
              <button
                className="btn btn-ghost btn-xs text-xs"
                onClick={() =>
                  handleCopy("0xd385764e63101856c182727520ecfd2bc0abaed9")
                }
              >
                <Image
                  src={"/copy.svg"}
                  width={15}
                  height={15}
                  alt="site logo"
                />
              </button>
            </div>
          </div>
        </section>
        <footer className="footer bg-[#262D3A] text-neutral-content p-10 flex justify-center">
          <div className="flex items-center justify-between max-w-6xl w-full">
            <aside>
              <div className="flex items-center gap-2">
                <Image
                  src={"/logo.png"}
                  width={35}
                  height={35}
                  alt="logo"
                  draggable={false}
                />
                <div className="text-xl">Fintyh Coin (FTC)</div>
              </div>
            </aside>
            <nav>
              <h6 className="footer-title">Social</h6>
              <div className="grid grid-flow-col gap-4">
                <Link
                  href={"https://fintyh.com/"}
                  target="_blank"
                  className="cursor-pointer"
                >
                  <Image
                    src={"/web.svg"}
                    width={24}
                    height={24}
                    alt="site logo"
                  />
                </Link>
                <Link
                  href={"https://x.com/FINTYHSFD"}
                  target="_blank"
                  className="cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="fill-current"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                  </svg>
                </Link>
                <Link
                  href={"https://t.me/fintyhcoin"}
                  target="_blank"
                  className="cursor-pointer"
                >
                  <Image
                    src={"/telegram.svg"}
                    width={24}
                    height={24}
                    alt="site logo"
                  />
                </Link>
              </div>
            </nav>
          </div>
        </footer>
        {isConnected && allowanceLoading && (
          <div className="w-full min-h-screen z-10 bg-slate-950/40 absolute flex items-center justify-center">
            <span className="loading loading-infinity loading-lg text-secondary"></span>
          </div>
        )}
        <div className="toast toast-bottom toast-right">
          {isSuccessToast && (
            <div className="alert alert-success text-slate-50">
              <span>Transaction has been confirmed!</span>
            </div>
          )}
          {isPendingToast && (
            <div className="alert alert-info text-slate-50">
              <span>Your transaction is on its way!</span>
            </div>
          )}
          {isErrorToast && (
            <div className="alert alert-error text-slate-50">
              <span>Transaction has been failed!</span>
            </div>
          )}
        </div>
        <div className="toast toast-top toast-right">
          {isCopy && (
            <div className="alert alert-success text-slate-50">
              <span>Copied!</span>
            </div>
          )}
        </div>
      </main>
    )
  );
}
