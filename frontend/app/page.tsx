"use client"

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Lock, Send } from "lucide-react";
import React, { useState } from "react";

export default function ChatInput() {
  const [input, setInput] = useState("");
  const [personalized, setPersonalized] = useState(false);

  const handleSend = () => {
    // Replace this with your send logic
    setInput("");
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white bg-opacity-80 rounded-2xl border border-slate-300 shadow-sm p-0 flex flex-col">
      <div className="relative w-full flex items-center">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Who are the alumni working in artificial intelligence at Google?"
          className="pl-4 pr-12 py-6 text-base bg-transparent border-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="button"
          size="icon"
          className="absolute right-2 bottom-2 bg-slate-200 text-slate-700 shadow-none hover:bg-slate-300"
          disabled={!input}
          onClick={handleSend}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex items-center px-3 pb-3 pt-2">
        <Switch
          checked={personalized}
          onCheckedChange={setPersonalized}
          className="mr-2"
          id="personalized-switch"
        />
        <label htmlFor="personalized-switch" className="flex items-center gap-1 text-sm text-slate-500 cursor-pointer select-none">
          Personalized <Lock className="w-3 h-3" />
        </label>
      </div>
    </div>
  );
}
