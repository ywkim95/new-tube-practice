"use client";

import { useState } from "react";
import superjson from "superjson";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";

import { AppRouter } from "./routers/_app";
import { makeQueryClient } from "./query-client";

export const trpc = createTRPCReact<AppRouter>();

let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  return (clientQueryClientSingleton ??= makeQueryClient());
}

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // Vercel을 선택하지 않았다면 다른 환경 변수 사용
    return "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

export function TRPCProvider(props: Readonly<{ children: React.ReactNode }>) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
          async headers() {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    </trpc.Provider>
  );
}
