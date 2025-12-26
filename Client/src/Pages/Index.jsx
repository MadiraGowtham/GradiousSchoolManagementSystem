import React from "react";
import { useLocation} from "react-router-dom";
import Header from "../Components/Header";
import Dashboard from "../Components/Dashboard";
import "../App.css";
import { useEffect } from "react";

function Index() {
  const location = useLocation();
  const Email = localStorage.getItem("Email");

  return (
    <div className="index-page">
      <Header/>
      <Dashboard/>
    </div>
  );
}

export default Index;
