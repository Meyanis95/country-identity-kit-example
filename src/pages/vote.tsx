/* eslint-disable react/no-unescaped-entities */
import { useAnonAadhaar, useProver } from "@anon-aadhaar/react";
import {
  AnonAadhaarCore,
  deserialize,
  packGroth16Proof,
} from "@anon-aadhaar/core";
import { useEffect, useState, useContext } from "react";
import { Ratings } from "@/components/Ratings";
import { Loader } from "@/components/Loader";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import anonAadhaarVote from "../../public/AnonAadhaarVote.json";
import { hasVoted } from "@/utils";
import { AppContext } from "./_app";
import { writeContract } from "@wagmi/core";
import { wagmiConfig } from "../config";

export default function Vote() {
  const [anonAadhaar] = useAnonAadhaar();
  const { isTestMode, setVoted } = useContext(AppContext);
  const [, latestProof] = useProver();
  const [anonAadhaarCore, setAnonAadhaarCore] = useState<AnonAadhaarCore>();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [rating, setRating] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const sendVote = async (
    _rating: string,
    _anonAadhaarCore: AnonAadhaarCore
  ) => {
    const packedGroth16Proof = packGroth16Proof(
      _anonAadhaarCore.proof.groth16Proof
    );
    setIsLoading(true);
    try {
      const voteTx = await writeContract(wagmiConfig, {
        abi: anonAadhaarVote.abi,
        address: `0x${
          isTestMode
            ? process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_TEST
            : process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS_PROD
        }`,
        functionName: "voteForProposal",
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
      setIsLoading(false);
      setIsSuccess(true);
      console.log("Vote transaction: ", voteTx);
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  useEffect(() => {
    // To do: fix the hook in the react lib
    const aaObj = localStorage.getItem("anonAadhaar");
    const anonAadhaarProofs = JSON.parse(aaObj!).anonAadhaarProofs;

    deserialize(
      anonAadhaarProofs[Object.keys(anonAadhaarProofs).length - 1].pcd
    ).then((result) => {
      console.log(result);
      setAnonAadhaarCore(result);
    });
  }, [anonAadhaar, latestProof]);

  useEffect(() => {
    anonAadhaarCore?.proof.nullifier
      ? hasVoted(anonAadhaarCore?.proof.nullifier, isTestMode).then(
          (response) => {
            if (response) router.push("/results");
            setVoted(response);
          }
        )
      : null;
  }, [isTestMode, router, setVoted, anonAadhaarCore]);

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
