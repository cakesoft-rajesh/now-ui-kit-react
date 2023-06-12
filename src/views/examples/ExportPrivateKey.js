import Web3 from "web3";
import OtpInput from "react-otp-input";
import React, { Component } from "react";
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
  Form,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
} from "reactstrap";
import { BottomSheet } from "react-spring-bottom-sheet"
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import membershipABI from "../../contracts_abi/membership.json";
import membershipWithExpiryABI from "../../contracts_abi/membershipExpiry.json";
import * as Server from "../../utils/Server";
import "react-spring-bottom-sheet/dist/style.css"

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