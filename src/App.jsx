import "./App.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import web3 from "./web3";
import lottery from "./lottery";
import numeral from "numeral";

export default function App() {
  // Get and set accounts
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    async function fetchAccounts() {
      await web3.eth.requestAccounts();
      const accounts = await web3.eth.getAccounts();
      setAccounts(accounts);
    }
    fetchAccounts();
  }, []);

  const [manager, setManager] = useState("");
  useEffect(() => {
    async function fetchManager() {
      const manager = await lottery.methods.manager().call();
      setManager(manager);
    }
    fetchManager();
  }, []);

  const [players, setPlayers] = useState([]);
  async function fetchPlayers() {
    const players = await lottery.methods.getPlayers().call();
    setPlayers(players);
  }
  useEffect(() => {
    fetchPlayers();
  }, []);

  const [balance, setBalance] = useState(0);
  async function fetchBalance() {
    const balance = await web3.eth.getBalance(lottery.options.address);
    setBalance(balance);
  }
  useEffect(() => {
    fetchBalance();
  }, []);

  const etherString = useMemo(() => {
    const balanceInEther = web3.utils.fromWei(balance.toString(), "ether");
    return numeral(balanceInEther).format("0,0.00");
  }, [balance]);

  const [value, setValue] = useState(0);
  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setMessage(`Entering lottery with ${value}`);
      await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei(value, "ether"),
      });
      setValue(0);
      setMessage("Refreshing New Balance");
      await Promise.all([fetchBalance(), fetchPlayers()]);
      setMessage("");
    },
    [accounts, value]
  );
  const [message, setMessage] = useState("");

  return (
    <div>
      <h2>Lottery Contract</h2>
      <p>
        This contract is managed by <strong>{manager}</strong> There are
        currently <strong>{players.length} people entered</strong>, competing to
        win <strong>{etherString} ether</strong>!
      </p>
      <hr />
      <form onSubmit={onSubmit}>
        <h4 style={{ fontSize: "1.4em", color: "darkcyan" }}>
          Want to try your luck?
        </h4>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ fontWeight: "bold", paddingBottom: "1em" }}>
            Amount of ether to enter:
          </label>
          <input
            type="number"
            onChange={(event) => setValue(event.target.value)}
            value={value}
            style={{ width: "8em" }}
          />
          <div style={{ paddingTop: "1em" }}>
            <button>Enter</button>
          </div>
        </div>
      </form>

      <hr />
      <h4 style={{ fontSize: "1.4em", color: "darkcyan" }}>
        Time to pick a winner?
      </h4>
      <button
        onClick={async () => {
          setMessage("Picking a winner...");
          await lottery.methods.pickWinner().send({ from: accounts[0] });
          setMessage("Refreshing New Balance");
          await Promise.all([fetchBalance(), fetchPlayers()]);
          setMessage("A winner has been picked!");
        }}
      >
        Pick a winner!
      </button>

      <hr />
      <h1>{message}</h1>
    </div>
  );
}
