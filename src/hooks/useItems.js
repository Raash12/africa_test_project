import { useEffect, useState } from "react";
import { getItems } from "@/services/items/itemService";

export default function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    const data = await getItems();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return { items, loading, refreshItems: fetchItems };
}