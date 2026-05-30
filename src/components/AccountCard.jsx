function AccountCard({ title, amount, icon, color }) {
  return (
    <div
      style={{
        background: "white",
        padding: "15px",
        borderRadius: "15px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "20px",
          marginBottom: "10px",
        }}
      >
        {icon}
      </div>

      <h4>{title}</h4>
      <p>{amount}</p>
    </div>
  );
}

export default AccountCard;