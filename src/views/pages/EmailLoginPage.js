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
import config from "../../config";
import * as Server from "../../utils/Server";
import "react-spring-bottom-sheet/dist/style.css"

class EmailLoginPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      toAddress: "",
      value: 0,
      email: "",
      otp: "",
      balance: 0,
      transcationHash: "",
      showSheetForOTP: false,
      showSheetForAccount: false,
      showSheetForAddress: false,
      showTokenTransferModal: false,
      rpcUrl: config.rpcUrl
    };
  }

  createWallet = () => {
    let web3 = new Web3(this.state.rpcUrl);
    let account = web3.eth.accounts.create();
    localStorage.setItem("walletAddress", account.address);
    localStorage.setItem("privateKey", account.privateKey);
    this.setState({ showSheetForAccount: false, showSheetForAddress: true });
  }

  getBalance = async (address) => {
    let web3 = new Web3(this.state.rpcUrl);
    let balance = web3.utils.fromWei(await web3.eth.getBalance(address));
    return balance;
  }

  mint = async () => {
    try {
      this.setState({ showLoader: true });
      if (this.state.balance === 0 || this.state.balance < 0) throw Error("Insufficient balance");
      let walletAddress = localStorage.getItem("walletAddress");
      const tokenId = new Date().getTime();
      const web3 = new Web3(this.state.rpcUrl);
      await web3.eth.accounts.wallet.add(localStorage.getItem("privateKey"));
      const myContract = await new web3.eth.Contract(membershipABI, config.REACT_APP_CONTRACT_ADDRESS, { gas: 1000000 });
      let blockchainResponse = await myContract.methods
        .mintMembership("Mint_Membership", tokenId)
        .send(
          {
            from: walletAddress
          }
        );
      if (blockchainResponse.status) {
        localStorage.setItem("tokenId", tokenId);
        this.setState({
          showLoader: false,
          transcationHash: blockchainResponse.transactionHash
        });
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  }

  tokenTransfer = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      if (this.state.balance === 0 || this.state.balance < 0) throw Error("Insufficient balance");
      let walletAddress = localStorage.getItem("walletAddress");
      const web3 = new Web3(this.state.rpcUrl);
      await web3.eth.accounts.wallet.add(localStorage.getItem("privateKey"));
      const myContract = await new web3.eth.Contract(membershipWithExpiryABI, config.REACT_APP_CONTRACT_ADDRESS_WITH_EXPIRY, { gas: 1000000 });
      let blockchainResponse = await myContract.methods
        .payment(this.state.toAddress)
        .send(
          {
            from: walletAddress,
            value: await web3.utils.toWei(this.state.value.toString(), "ether"),
          }
        );
      // let blockchainResponse = await web3.eth.sendTransaction(
      //   {
      //     from: walletAddress,
      //     to: this.state.toAddress,
      //     value: await web3.utils.toWei(this.state.value.toString(), "ether"),
      //     gas: 21000
      //   }
      // );
      if (blockchainResponse.status) {
        this.notificationSystem.addNotification({
          message: "Transfer successful",
          level: "success",
        });
        let balance = await this.getBalance(walletAddress);
        this.setState({
          showLoader: false,
          balance,
          transcationHash: blockchainResponse.transactionHash
        });
        this.toggleTokenTransferModal();
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  }

  sendOTP = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/email/sendOTP",
        method: "POST",
        data: {
          email: this.state.email
        }
      });
      if (response.success) {
        this.setState({ showLoader: false, showSheetForOTP: true });
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  verifyOTP = async () => {
    try {
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/email/verifyOTP",
        method: "POST",
        data: {
          email: this.state.email,
          otp: this.state.otp,
        }
      });
      if (response.success) {
        let walletAddress = localStorage.getItem("walletAddress");
        let balance = 0;
        if (!walletAddress) {
          this.setState({ balance, showLoader: false, showSheetForOTP: false, showSheetForAccount: true });
        } else {
          balance = await this.getBalance(walletAddress);
          this.setState({ balance, showLoader: false, showSheetForOTP: false, showSheetForAddress: true });
        }
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  // exportPrivateKey = () => {
  //   // Create element with <a> tag
  //   const link = document.createElement("a");

  //   // Create a blog object with the file content which you want to add to the file
  //   const file = new Blob([localStorage.getItem("privateKey")], { type: "text/plain" });

  //   // Add file content in the object URL
  //   link.href = URL.createObjectURL(file);

  //   // Add file name
  //   link.download = "private_key.txt";

  //   // Add click event to <a> tag to save file.
  //   link.click();
  //   URL.revokeObjectURL(link.href);
  // }

  toggleTokenTransferModal = () => {
    this.setState({
      showTokenTransferModal: !this.state.showTokenTransferModal,
      showSheetForAddress: !this.state.showSheetForAddress
    });
  };

  getWidth = () => {
    let width = window.innerWidth;
    if (width <= 220) {
      return "20px";
    }
    else if (width > 220 && width <= 250) {
      return "25px";
    }
    else if (width > 250 && width <= 350) {
      return "30px";
    }
    else if (width > 350 && width <= 400) {
      return "40px";
    }
    else if (width > 400) {
      return "50px";
    }
  }

  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <div
              style={{
                // height: "100vh",
                // justifyContent: "center",
                flexDirection: "column",
                display: "flex",
                marginTop: 100,
              }}
            >
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <img
                    style={{ height: "50px", width: "50px" }}
                    alt="..."
                    src="nusantaraBlue.png"
                  ></img>
                </div>
              </Row>
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <Col
                  md="3"
                  sm="4"
                  style={{
                    width: "90%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Form onSubmit={(event) => this.sendOTP(event)}>
                    <Row
                      style={{
                        justifyContent: "center",
                        marginLeft: 10,
                        marginRight: 10,
                        marginTop: 25,
                      }}
                    >
                      <FormGroup style={{ width: "100%" }}>
                        <label
                          style={{
                            fontSize: "15px",
                            fontWeight: "bold",
                            marginLeft: "10px",
                            margin: "10px"
                          }}
                        >
                          Email
                        </label>
                        <Input
                          style={{
                            marginBottom: 10,
                            width: "100%",
                            borderColor: "gray",
                          }}
                          placeholder="Enter the email"
                          type="email"
                          value={this.state.email}
                          onChange={(event) =>
                            this.setState({ email: event.target.value })
                          }
                          required
                        ></Input>
                      </FormGroup>
                    </Row>
                    <Row style={{ justifyContent: "center", alignItems: "center" }}>
                      <Button
                        style={{
                          width: "100%",
                          padding: "13px 0px",
                          fontSize: "15px",
                          fontWeight: "bold",
                        }}
                        className="btn-round"
                        color="info"
                        type="submit"
                        size="lg"
                      >
                        Login with email
                      </Button>
                    </Row>
                  </Form>
                </Col>
              </Row>
            </div>
        }
        <NotificationSystem
          dismissible={false}
          ref={(notificationSystem) =>
            (this.notificationSystem = notificationSystem)
          }
        />
        {this.state.showTokenTransferModal ? (
          <Modal
            isOpen={this.state.showTokenTransferModal}
            toggle={this.toggleTokenTransferModal}
            className="modal-md"
            style={{ width: "90%" }}
            centered
          >
            <ModalHeader toggle={this.toggleTokenTransferModal}>
              Token Transfer
            </ModalHeader>
            <ModalBody>
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <Col
                  xs="12"
                >
                  <Form onSubmit={(event) => this.tokenTransfer(event)}>
                    <Row
                      style={{
                        justifyContent: "center",
                        marginLeft: 10,
                        marginRight: 10,
                      }}
                    >
                      <FormGroup style={{ width: "100%" }}>
                        <label
                          style={{
                            fontSize: "15px",
                            fontWeight: "bold",
                            marginLeft: 10,
                            marginRight: 10,
                          }}
                        >
                          From :
                        </label>
                        <Input
                          style={{
                            marginBottom: 10,
                            width: "100%",
                            borderColor: "gray",
                          }}
                          placeholder="From"
                          type="text"
                          value={localStorage.getItem("walletAddress")}
                          disabled
                        ></Input>
                      </FormGroup>
                    </Row>
                    <Row
                      style={{
                        justifyContent: "center",
                        marginLeft: 10,
                        marginRight: 10,
                      }}
                    >
                      <FormGroup style={{ width: "100%" }}>
                        <label
                          style={{
                            fontSize: "15px",
                            fontWeight: "bold",
                            marginLeft: 10,
                            marginRight: 10,
                          }}
                        >
                          To :
                        </label>
                        <Input
                          style={{
                            marginBottom: 10,
                            width: "100%",
                            borderColor: "gray",
                          }}
                          placeholder="To Address"
                          type="text"
                          value={this.state.toAddress}
                          onChange={(event) =>
                            this.setState({ toAddress: event.target.value })
                          }
                          required
                        ></Input>
                      </FormGroup>
                    </Row>
                    <Row
                      style={{
                        justifyContent: "center",
                        marginLeft: 10,
                        marginRight: 10,
                      }}
                    >
                      <FormGroup style={{ width: "100%" }}>
                        <label
                          style={{
                            fontSize: "15px",
                            fontWeight: "bold",
                            marginLeft: 10,
                            marginRight: 10,
                          }}
                        >
                          Value :
                        </label>
                        <Input
                          style={{
                            marginBottom: 10,
                            width: "100%",
                            borderColor: "gray",
                          }}
                          placeholder="Enter the value"
                          type="number"
                          value={this.state.value}
                          onChange={(event) =>
                            this.setState({ value: event.target.value })
                          }
                          required
                        ></Input>
                      </FormGroup>
                    </Row>
                    <Row style={{
                      justifyContent: "center",
                      alignItems: "center",
                      marginLeft: 10,
                      marginRight: 10,
                    }}>
                      <Button
                        style={{
                          width: "100%",
                          padding: "13px 0px",
                          fontSize: "15px",
                          fontWeight: "bold",
                        }}
                        className="btn-round"
                        color="info"
                        type="submit"
                        size="lg"
                      >
                        Send
                      </Button>
                    </Row>
                  </Form>
                </Col>
              </Row>
            </ModalBody>
          </Modal>
        ) : null}
        <BottomSheet
          expandOnContentDrag={true}
          open={this.state.showSheetForOTP}
          defaultSnap={({ maxHeight }) => maxHeight / 2}
          snapPoints={({ maxHeight }) => [
            maxHeight - maxHeight / 10,
            maxHeight / 4,
            maxHeight * 0.6,
          ]}
        >
          <style>
            {`[data-rsbs-overlay] {
            background: #2CA8FF;
          }`}
          </style>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 0px",
              marginTop: 15,
            }}
          >
            <img
              style={{ height: "40px", width: "40px", marginTop: "5px" }}
              alt="..."
              src="nusantaraWhite.png"
            ></img>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 0px",
              marginTop: 20,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Enter the OTP
            </div>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 30px",
              marginTop: 30,
            }}
          >
            <OtpInput
              className="d-flex justify-content-center"
              inputStyle={{
                color: "black",
                width: this.getWidth(),
                height: "50px",
                margin: "0 5px",
                fontSize: "25px",
                borderRadius: "5px",
                border:
                  "1px solid rgba(0,0,0,0.3)",
                outlineColor: "#17517b",
              }}
              isInputNum={true}
              value={this.state.otp}
              onChange={(value) =>
                this.setState({
                  otp: value,
                })
              }
              numInputs={6}
              separator={<span style={{ color: "#fff" }}>-</span>}
            />
          </Row>
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            <Button
              style={{
                padding: "10px 29px",
                fontSize: "15px",
                fontWeight: "bold",
                backgroundColor: "white",
                color: "black",
              }}
              onClick={this.verifyOTP}
              className="btn-round mr-2"
              color="black"
              type="button"
              size="lg"
            >
              verify OTP
            </Button>
          </Row>
          <Row style={{ justifyContent: "center", alignItems: "center" }}>

          </Row>
        </BottomSheet>
        <BottomSheet
          open={this.state.showSheetForAddress}
          snapPoints={({ minHeight }) => minHeight}
        >
          <style>
            {`[data-rsbs-overlay] {
            background: #2CA8FF;
          }`}
          </style>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 0px",
              marginTop: 15,
            }}
          >
            <img
              style={{ height: "40px", width: "40px", marginTop: "5px" }}
              alt="..."
              src="nusantaraWhite.png"
            ></img>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 0px",
              marginTop: 20,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Welcome
            </div>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              textAlign: "center",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              margin: "15px"
            }}
          >
            <Col xs={6}>Account</Col>
            <Col xs={6}>Balance</Col>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              textAlign: "center",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              margin: "15px"
            }}
          >
            <Col xs={6} style={{ wordBreak: "break-all" }}>
              <a
                style={{
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
                rel="noreferrer"
                href={`https://mumbai.polygonscan.com/address/${localStorage.getItem("walletAddress")}`}
                target="_blank"
              >
                {localStorage.getItem("walletAddress")}
              </a>
            </Col>
            <Col xs={6} style={{ wordBreak: "break-all" }}>{this.state.balance}</Col>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginTop: 30,
            }}
          >
            <Button
              style={{
                padding: "10px 29px",
                fontSize: "15px",
                fontWeight: "bold",
                backgroundColor: "white",
                color: "black",
              }}
              onClick={this.toggleTokenTransferModal}
              className="btn-round mr-2"
              color="black"
              type="button"
              size="lg"
            >
              Test Transfer
            </Button>
            <Button
              style={{
                padding: "10px 29px",
                fontSize: "15px",
                fontWeight: "bold",
                backgroundColor: "white",
                color: "black",
              }}
              onClick={this.mint}
              className="btn-round"
              color="black"
              type="button"
              size="lg"
            >
              Mint
            </Button>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              style={{
                padding: "10px 29px",
                fontSize: "15px",
                fontWeight: "bold",
                backgroundColor: "white",
                color: "black",
              }}
              // onClick={this.exportPrivateKey}
              className="btn-round mr-2"
              color="black"
              type="button"
              size="lg"
            >
              <a
                style={{
                  color: "black"
                }}
                rel="noreferrer"
                href={`${window.location.origin}/exportPrivateKey?privateKey=${localStorage.getItem('privateKey')}`}
                target="_blank"
              >
                Export Private Key
              </a>
            </Button>
          </Row>
          {this.state.transcationHash
            &&
            <Row style={{ marginBottom: 10, justifyContent: "center", alignItems: "center" }}>
              <a
                style={{
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
                rel="noreferrer"
                href={`https://mumbai.polygonscan.com/tx/${this.state.transcationHash}`}
                target="_blank"
              >
                View Transaction
              </a>
            </Row>
          }
        </BottomSheet >
        <BottomSheet
          open={this.state.showSheetForAccount}
          snapPoints={({ minHeight }) => minHeight}
        >
          <style>
            {`[data-rsbs-overlay] {
            background: #2CA8FF;
          }`}
          </style>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 0px",
              marginTop: 15,
            }}
          >
            <img
              style={{ height: "40px", width: "40px", marginTop: "5px" }}
              alt="..."
              src="nusantaraWhite.png"
            ></img>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              margin: "0px 0px",
              marginTop: 20,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Welcome
            </div>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 30,
            }}
          >
            <Col xs={12} style={{ padding: "0px 25px", textAlign: "center" }}>
              <Button
                style={{
                  padding: "10px 29px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  backgroundColor: "white",
                  color: "black",
                }}
                // onClick={this.toggleTokenTransferModal}
                className="btn-round mr-2"
                color="black"
                type="button"
                size="lg"
              >
                <Label
                  htmlFor="privateKey"
                  className="m-0"
                  style={{
                    cursor: "pointer",
                  }}
                >
                  Import using private key
                </Label>

              </Button>
              <Input
                id="privateKey"
                style={{ display: "none" }}
                type="file"
                accept=".txt"
                onChange={(event) => {
                  const reader = new FileReader()
                  reader.onload = async (e) => {
                    const text = (e.target.result);
                    let web3 = new Web3(this.state.rpcUrl);
                    let account = web3.eth.accounts.privateKeyToAccount(text);
                    localStorage.setItem("walletAddress", account.address);
                    localStorage.setItem("privateKey", account.privateKey);
                    let balance = await this.getBalance(account.address);
                    this.setState({
                      balance,
                      showSheetForAccount: false,
                      showSheetForAddress: true
                    });
                  };
                  reader.readAsText(event.target.files[0])
                }}
              />
              <Button
                style={{
                  padding: "10px 29px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  backgroundColor: "white",
                  color: "black",
                }}
                onClick={this.createWallet}
                className="btn-round"
                color="black"
                type="button"
                size="lg"
              >
                Create new
              </Button>
            </Col>
          </Row>
        </BottomSheet >
      </>
    );
  }
}

export default EmailLoginPage;