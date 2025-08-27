import { useState } from "react";

export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [logged, setLogged] = useState(false);

  const login = () => {
    if (username === "Peterr" && password === "54321") {
      setLogged(true);
    } else {
      alert("Wrong credentials!");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      {!logged ? (
        <div>
          <h2>Admin Login</h2>
          <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} /><br />
          <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} /><br />
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <h2>Welcome, Admin! 🎉 (Dashboard here)</h2>
      )}
    </div>
  );
}
