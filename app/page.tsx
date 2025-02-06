'use client'
import dynamic from "next/dynamic"
import { useState, useEffect } from 'react'


export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const Map = dynamic(() => import("./components/Map"), { ssr: false });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div>
      {isMounted && <Map />}
    </div>
  )
}
