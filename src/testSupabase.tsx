import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import React from "react";

const TestSupabase = () => {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .limit(2);
        if (error) throw error;
        setMessage("✅ Supabase Connected! Got data: " + JSON.stringify(data) );
      } catch (err: any) {
        setMessage("❌ Connection Failed: " + err.message);
      }
    };

    checkConnection();
  }, []);

  return <div>{message}</div>;
};

export default TestSupabase;
