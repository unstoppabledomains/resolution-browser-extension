import config from "@unstoppabledomains/config";

export const getReverseResolution = async (
  address: string,
): Promise<string | undefined> => {
  const resolutionResponse = await fetch(
    `${config.PROFILE.HOST_URL}/resolve/${address}?resolutionOrder=ud,ens`,
  );
  if (resolutionResponse.ok) {
    const resolutionData = await resolutionResponse.json();
    return resolutionData?.name;
  }
  return undefined;
};
