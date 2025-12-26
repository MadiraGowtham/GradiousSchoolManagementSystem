import React, { useEffect } from "react";;
import Header from '../Components/Header';
import Marks from '../Components/Marks';

function MarksPage() {
  return (
    <div className="marks-page">
      <Header/>
      <Marks/>
    </div>
  );
}

export default MarksPage;
