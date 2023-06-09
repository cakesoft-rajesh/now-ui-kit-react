import Web3 from 'web3';
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
} from "reactstrap";
import { BottomSheet } from 'react-spring-bottom-sheet'
import NotificationSystem from "react-notification-system";
import PageSpinner from "../../components/PageSpinner";
import membershipABI from "../../contracts_abi/membership.json";
import * as Server from "../../utils/Server";
import 'react-spring-bottom-sheet/dist/style.css'

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
      showSheetForAddress: false,
      showTokenTransferModal: false,
      rpcUrl1: "https://rpc-mumbai.maticvigil.com/",
      rpcUrl: "https://matic-mumbai.chainstacklabs.com",
    };
  }

  createWallet = () => {
    let web3 = new Web3(this.state.rpcUrl);
    let account = web3.eth.accounts.create();
    return {
      address: account.address,
      privateKey: account.privateKey
    };
  }

  getBalance = async (address) => {
    let web3 = new Web3(this.state.rpcUrl);
    let balance = web3.utils.fromWei(await web3.eth.getBalance(address));
    return balance;
  }

  mint = async () => {
    try {
      this.setState({ showLoader: true });
      if (this.state.balance === 0 || this.state.balance < 0) throw Error('Insufficient balance');
      let walletAddress = localStorage.getItem('walletAddress');
      const tokenId = new Date().getTime();
      const web3 = new Web3(this.state.rpcUrl);
      await web3.eth.accounts.wallet.add(localStorage.getItem('privateKey'));
      const myContract = await new web3.eth.Contract(membershipABI, process.env.REACT_APP_CONTRACT_ADDRESS, { gas: 1000000 });
      let blockchainResponse = await myContract.methods
        .mintMembership('test_data', tokenId)
        .send(
          {
            from: walletAddress
          }
        );
      if (blockchainResponse.status) {
        localStorage.setItem('tokenId', tokenId);
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
      if (this.state.balance === 0 || this.state.balance < 0) throw Error('Insufficient balance');
      let walletAddress = localStorage.getItem('walletAddress');
      const web3 = new Web3(this.state.rpcUrl);
      await web3.eth.accounts.wallet.add(localStorage.getItem('privateKey'));
      let blockchainResponse = await web3.eth.sendTransaction(
        {
          from: walletAddress,
          to: this.state.toAddress,
          value: await web3.utils.toWei(this.state.value.toString(), 'ether'),
          gas: 21000
        }
      );
      if (blockchainResponse.status) {
        this.notificationSystem.addNotification({
          message: 'Transfer successful',
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
        localStorage.setItem('signupOrLoginMethod', 'web3');
        let walletAddress = localStorage.getItem('walletAddress');
        let balance = 0;
        if (!walletAddress) {
          let { address, privateKey } = this.createWallet();
          walletAddress = address;
          localStorage.setItem('walletAddress', address);
          localStorage.setItem('privateKey', privateKey);
        } else {
          balance = await this.getBalance(walletAddress);
        }
        this.setState({ balance, showLoader: false, showSheetForOTP: false, showSheetForAddress: true });
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  toggleTokenTransferModal = () => {
    this.setState({
      showTokenTransferModal: !this.state.showTokenTransferModal,
      showSheetForAddress: !this.state.showSheetForAddress
    });
  };

  render() {
    return (
      <>
        <PageSpinner showLoader={this.state.showLoader} />
        <div
          style={{
            // height: "100vh",
            // justifyContent: "center",
            flexDirection: "column",
            display: "flex",
            marginTop: 100,
          }}
        >
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ display: 'flex', justifyContent: "center", alignItems: "center" }}>
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
                        fontSize: '15px',
                        fontWeight: 'bold',
                        marginLeft: '10px',
                        margin: '10px'
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
                            fontSize: '15px',
                            fontWeight: 'bold',
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
                          value={localStorage.getItem('walletAddress')}
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
                            fontSize: '15px',
                            fontWeight: 'bold',
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
                            fontSize: '15px',
                            fontWeight: 'bold',
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
          open={this.state.showSheetForOTP}
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
                width: "3rem",
                height: "3rem",
                margin: "0 1rem",
                fontSize: "2rem",
                borderRadius: "4px",
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
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '15px'
            }}
          >
            <Col xs={6}>Account</Col>
            <Col xs={6}>Balance</Col>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              textAlign: "center",
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '15px'
            }}
          >
            <Col xs={6} style={{ wordBreak: 'break-all' }}>
              <a
                style={{
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
                rel='noreferrer'
                href={`https://mumbai.polygonscan.com/address/${localStorage.getItem('walletAddress')}`}
                target='_blank'
              >
                {localStorage.getItem('walletAddress')}
              </a>
            </Col>
            <Col xs={6}>{this.state.balance}</Col>
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
          {this.state.transcationHash
            &&
            <Row style={{ margin: "10px 0px", justifyContent: "center", alignItems: "center" }}>
              <a
                style={{
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
                rel='noreferrer'
                href={`https://mumbai.polygonscan.com/tx/${this.state.transcationHash}`}
                target='_blank'
              >
                View Transaction
              </a>
            </Row>
          }
        </BottomSheet >
      </>
    );
  }
}

export default EmailLoginPage;