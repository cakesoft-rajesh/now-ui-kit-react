import React, { Component } from "react";

class ExportPrivateKey extends Component {

  constructor(props) {
    super(props);
    this.exportPrivateKey();
  }

  exportPrivateKey = () => {
    // Create element with <a> tag
    const link = document.createElement("a");

    // Create a blog object with the file content which you want to add to the file
    const file = new Blob([localStorage.getItem("privateKey")], { type: "text/plain" });

    // Add file content in the object URL
    link.href = URL.createObjectURL(file);

    // Add file name
    link.download = "private_key.txt";

    // Add click event to <a> tag to save file.
    link.click();
    URL.revokeObjectURL(link.href);
    window.close();
  }


  render() {
    return <></>;
  }
}

export default ExportPrivateKey;