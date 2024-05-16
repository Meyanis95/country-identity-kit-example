/* eslint-disable react/no-unescaped-entities */
import { useAnonAadhaar, useProver } from "@anon-aadhaar/react";
import {
  AnonAadhaarCore,
  packGroth16Proof,
  deserialize,
} from "@anon-aadhaar/core";
import {
  useEffect,
  useState,
  SetStateAction,
  Dispatch,
  useContext,
} from "react";
import { Ratings } from "@/components/Ratings";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/router";
import { useAccount, useContractWrite } from "wagmi";
import anonAadhaarVote from "../../public/AnonAadhaarVote.json";
import { UserStatus } from "@/interface";
import { hasVoted } from "@/utils";
import { AppContext } from "./_app";

type VoteProps = {
  setUserStatus: Dispatch<SetStateAction<UserStatus>>;
};

export default function Vote({ setUserStatus }: VoteProps) {
  const [anonAadhaar] = useAnonAadhaar();
  const { useTestAadhaar, setVoted } = useContext(AppContext);
  const [, latestProof] = useProver();
  const [anonAadhaarCore, setAnonAadhaarCore] = useState<AnonAadhaarCore>();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [rating, setRating] = useState<string>();
  const { data, isLoading, isSuccess, write } = useContractWrite({
    address: `0x${
      useTestAadhaar
        ? process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_TEST
        : process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_PROD
    }`,
    abi: anonAadhaarVote.abi,
    functionName: "voteForProposal",
  });

  console.log("Use test Aadhaar: ", useTestAadhaar);
  const sendVote = async (
    _rating: string,
    _anonAadhaarCore: AnonAadhaarCore
  ) => {
    const packedGroth16Proof = packGroth16Proof(
      _anonAadhaarCore.proof.groth16Proof
    );
    write({
      args: [
        _rating,
        _anonAadhaarCore.proof.nullifierSeed,
        _anonAadhaarCore.proof.nullifier,
        _anonAadhaarCore.proof.timestamp,
        address,
        [
          _anonAadhaarCore.proof.ageAbove18,
          _anonAadhaarCore.proof.gender,
          _anonAadhaarCore.proof.pincode,
          _anonAadhaarCore.proof.state,
        ],
        packedGroth16Proof,
      ],
    });
  };

  useEffect(() => {
    if (anonAadhaar.status === "logged-in") {
      setAnonAadhaarCore(latestProof);
    }
  }, [anonAadhaar, latestProof]);

  useEffect(() => {
    anonAadhaarCore?.proof.nullifier
      ? hasVoted(anonAadhaarCore?.proof.nullifier, useTestAadhaar).then(
          (response) => {
            if (response) router.push("/results");
            setVoted(response);
          }
        )
      : null;
  }, [address, useTestAadhaar, router, setVoted, anonAadhaarCore]);

  useEffect(() => {
    isConnected
      ? setUserStatus(UserStatus.WALLET_CONNECTED)
      : setUserStatus(UserStatus.WALLET_NOT_CONNECTED);
  }, [isConnected, setUserStatus]);

  useEffect(() => {
    if (isSuccess) router.push("./results");
  }, [router, isSuccess]);

  return (
    <>
      <main className="flex flex-col min-h-[75vh] mx-auto justify-center items-center w-full p-4">
        <div className="max-w-4xl w-full">
          <h2 className="text-[90px] font-rajdhani font-medium leading-none">
            CAST YOUR VOTE
          </h2>
          <div className="text-md mt-4 mb-8 text-[#717686]">
            Next, you have the option to cast your vote alongside your Anon
            Adhaar proof, using your connected ETH address. Your vote will be
            paired with your proof, and the smart contract will initially verify
            your proof before processing your vote.
          </div>

          <div className="flex flex-col gap-5">
            <div className="text-sm sm:text-lg font-medium font-rajdhani">
              {"On a scale of 0 to 5, how likely are you to recommend this hack?".toUpperCase()}
            </div>
            <Ratings setRating={setRating} />

            <div>
              {isConnected ? (
                // isSuccess ? (
                //   <>
                //     <button
                //       disabled={true}
                //       type="button"
                //       className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300"
                //     >
                //       Vote sent ✅
                //     </button>
                //     <div className="font-bold">
                //       You can check your transaction{" "}
                //       <a
                //         href={`https://sepolia.etherscan.io/tx/${data?.hash}`}
                //         target="_blank"
                //         className="text-blue-500"
                //       >
                //         here
                //       </a>
                //     </div>
                //   </>
                // ) :
                isLoading ? (
                  <Loader />
                ) : (
                  <button
                    disabled={
                      rating === undefined || anonAadhaarCore === undefined
                    }
                    type="button"
                    className="inline-block mt-5 bg-[#009A08] rounded-lg text-white px-14 py-1 border-2 border-[#009A08] font-rajdhani font-medium"
                    onClick={() => {
                      if (rating !== undefined && anonAadhaarCore !== undefined)
                        sendVote(rating, anonAadhaarCore);
                    }}
                  >
                    VOTE
                  </button>
                )
              ) : (
                <button
                  disabled={true}
                  type="button"
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300"
                >
                  You need to connect your wallet first ⬆️
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
