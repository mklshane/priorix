const withProtocol = (value: string) => {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `https://${value}`;
};

export const getSiteUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    return "http://localhost:3000";
  }

  return withProtocol(raw).replace(/\/$/, "");
};
