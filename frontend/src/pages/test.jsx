import { useEffect } from "react";
import { supabase } from "../services/supabase";

function Test() {

  useEffect(() => {

    async function testConnection() {

      const { data, error } =
        await supabase
          .from("customers")
          .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
    }

    testConnection();

  }, []);

  return (
    <div>
      <h1>Supabase Testing...</h1>
    </div>
  );
}

export default Test;