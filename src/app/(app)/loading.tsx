export default function AppLoading() {
  return (
    <div className="page" style={{ paddingTop: "2rem" }}>
      <div className="loading-block" />
      <div className="stats" style={{ marginTop: "1.25rem" }}>
        <div className="loading-block short" />
        <div className="loading-block short" />
        <div className="loading-block short" />
        <div className="loading-block short" />
      </div>
      <div className="loading-block tall" style={{ marginTop: "1.25rem" }} />
    </div>
  );
}
