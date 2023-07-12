import Head from "next/head";
import { Inter } from "next/font/google";
import { FileInput, pdfUpload, cerUpload } from "country-identity-kit";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [signedPdfData, setSignedPdfData] = useState(Buffer.from([]));
  const [signature, setSignature] = useState("");

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(await pdfUpload(e));
  };

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="">
        <h1>Welcome to Country Identity Example</h1>
        <p>Prove your anon addhaar ownership</p>

        <FileInput onChange={handlePdfChange} />

        {/* <FileInput
          onChange={(e) => {
            const { msgBigInt, sigBigInt, modulusBigInt } = cerUpload(
              e,
              signedPdfData,
              signature
            );

            console.log(
              "Data extracted: ",
              msgBigInt,
              sigBigInt,
              modulusBigInt
            );
          }}
        /> */}
      </main>
    </>
  );
}
