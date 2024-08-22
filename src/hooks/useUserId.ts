import {useState, useEffect} from "react";
import UserIdService from "../services/userIdService";
import {Logger} from "../lib/logger";

const userIdService = new UserIdService();

function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    userIdService
      .getUserId()
      .then((id) => {
        Logger.log(`Fetched user ID: ${id}`);
        setUserId(id);
      })
      .catch((err) => {
        Logger.error("Failed to retrieve user ID:", err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  return {userId, isLoading, error};
}

export default useUserId;
