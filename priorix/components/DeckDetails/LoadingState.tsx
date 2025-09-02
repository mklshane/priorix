const LoadingState = () => {
  return (
    <div className="w-[90%] mx-auto min-h-screen py-8 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading deck...</p>
      </div>
    </div>
  );
};

export default LoadingState;
