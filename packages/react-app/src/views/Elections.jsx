import { PageHeader } from "antd";
import { utils } from "ethers";
import { toWei } from "web3-utils";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Input,
  List,
  Progress,
  Slider,
  Spin,
  Switch,
  Table,
  Modal,
  Form,
  Checkbox,
  Select,
  Space,
  Tag,
} from "antd";
import { UserOutlined, LockOutlined, SyncOutlined } from "@ant-design/icons";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Address, Balance } from "../components";

import { useEventListener } from "../hooks";
import AddressInput from "../components/AddressInput";

const { Option } = Select;

export default function Elections({
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const [numElections, setNumElections] = useState(0);
  const [tableDataSrc, setTableDataSrc] = useState([]);
  const [newElecName, setNewElecName] = useState("");
  const [newElecAllocatedVotes, setNewElecAllocatedVotes] = useState(10);
  const [newElecAllocatedFunds, setNewElecAllocatedFunds] = useState(1);
  const [customAddress, setCustomAddress] = useState("");

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [newElecWorkers, setNewElecWorkers] = useState([]);
  const [newElecAddr, setNewElecAddr] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const [form] = Form.useForm();

  const route_history = useHistory();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  //   , , "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  //   "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
  function reverseMapping(obj) {
    var ret = {};
    for (var key in obj) {
      ret[obj[key]] = key;
    }
    return ret;
  }
  const worker_mapping = {
    acc_1: "0x76c48E1F02774C40372a3497620D946136136172",
    acc_2: "0x01684C57AE8a4226271068210Ce1cCED865a5AfC",
    acc_3: "0xf5De4337Ac5332aF11BffbeC45D950bDDBc1493F",
    acc_4: "0x4E53E14de4e264AC2C3fF501ed3Bd6c4Ad63B9A1",
  };

  function handleAddrSelected(value) {
    // console.log(value);
    const addrs = [];
    value.forEach(v => {
      const addr = worker_mapping[Object.keys(worker_mapping)[v]];
      addrs.push(addr);
    });
    setNewElecAddr(addrs);
  }

  function addCustomAddr() {
    if (customAddress != "") {
      setNewElecAddr([...newElecAddr, customAddress]);
      setCustomAddress("");
    }
  }

  function viewElection(record) {
    route_history.push("/voting/" + record.key);
    // console.log("record ", record);
  }

  const endElection = async record => {
    const result = tx(writeContracts.Diplomacy.endElection(record.key), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
  };

  const payoutElection = async record => {
    // const result = tx(
    //   writeContracts.Diplomacy.paypoutElection(record.key),
    //   update => {
    //     console.log("📡 Transaction Update:", update);
    //     if (update && (update.status === "confirmed" || update.status === 1)) {
    //       console.log(" 🍾 Transaction " + update.hash + " finished!");
    //     }
    //   },
    // );
    // console.log("awaiting metamask/web3 confirm result...", result);
    // console.log(await result);
  };

  const electionCreatedEvent = useEventListener(readContracts, "Diplomacy", "ElectionCreated", localProvider, 1);
  const ballotCastEvent = useEventListener(readContracts, "Diplomacy", "BallotCast", localProvider, 1);

  const columns = [
    {
      title: "Created date",
      dataIndex: "created_date",
      key: "created_date",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Creator",
      dataIndex: "admin",
      key: "admin",
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: roles => (
        <>
          {roles.map(r => {
            //   let color = tag.length > 5 ? 'geekblue' : 'green';
            //   if (tag === 'loser') {
            //     color = 'volcano';
            //   }
            let color = "geekblue";
            if (r == "candidate") {
              color = "green";
            }
            return (
              <Tag color={color} key={r}>
                {r.toLowerCase()}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: "# Workers",
      dataIndex: "n_workers",
      key: "n_workers",
    },
    {
      title: "# Voted",
      dataIndex: "n_voted",
      key: "n_voted",
    },
    {
      title: "Action",
      key: "action",
      render: (text, record, index) => (
        <>
          <Space size="middle">
            <Button type="primary" size="small" onClick={() => viewElection(record)}>
              View
            </Button>
            <Button type="primary" size="small" onClick={() => endElection(record)}>
              End
            </Button>
            <Button type="primary" size="small" onClick={() => payoutElection(record)}>
              Payout
            </Button>
          </Space>
        </>
      ),
    },
  ];
  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        console.log("readContracts");
        init();
      }
    }
  }, [readContracts]);

  useEffect(async () => {
    if (electionCreatedEvent && electionCreatedEvent.length == 0) {
      return;
    }
    if (readContracts) {
      if (readContracts.Diplomacy) {
        const numElectionsNew = (await readContracts.Diplomacy.numElections()).toNumber();
        if (numElectionsNew > numElections) {
          //   console.log("electionCreatedEvent ", electionCreatedEvent);
          updateView();
          setIsCreating(false);
          setNewElecAddr([]);
          setNewElecName("");
          form.resetFields();
        }
      }
    }
  }, [electionCreatedEvent]);

  useEffect(() => {
    if (ballotCastEvent && ballotCastEvent.length == 0) {
      return;
    }
    if (readContracts) {
      if (readContracts.Diplomacy) {
        console.log("ballot cast event");
        updateView();
      }
    }
  }, [ballotCastEvent]);

  const init = async () => {
    console.log("contract loaded ", address);

    let workers = [];
    for (let i = 0; i < Object.keys(worker_mapping).length; i++) {
      workers.push(<Option key={i}>{Object.keys(worker_mapping)[i]}</Option>);
    }
    setNewElecWorkers(workers);

    updateView();
  };

  const updateView = async () => {
    console.log("updateView ");
    const numElections = (await readContracts.Diplomacy.numElections()).toNumber();
    // console.log("numElections ", numElections);
    setNumElections(numElections);
    let data = [];
    let reverseWorkerMapping = reverseMapping(worker_mapping);
    let elections = [];
    for (let i = 0; i < numElections; i++) {
      const election = await readContracts.Diplomacy.getElectionById(i);
      //   console.log("election ", election);
      const name = election.name;
      const n_addr = election.n_addr.toNumber();
      const n_voted = (await readContracts.Diplomacy.getElectionVoted(i)).toNumber();
      let created_date = new Date(election.createdAt.toNumber() * 1000);
      created_date = created_date.toISOString().substring(0, 10);
      let admin = election.admin;
      //   console.log("admin ", admin, reverseWorkerMapping[admin]);
      if (reverseWorkerMapping[admin]) {
        admin = reverseWorkerMapping[admin];
      } else {
        admin = admin.substring(0, 6);
      }
      let roles = [];
      const isCreator = election.admin == address;
      if (isCreator) {
        roles.push("admin");
      }
      const isCandidate = await readContracts.Diplomacy.canVote(i, address);
      if (isCandidate) {
        roles.push("candidate");
      }
      data.push({
        key: i,
        created_date: created_date,
        name: name,
        n_workers: n_addr,
        n_voted: n_voted,
        admin: admin,
        roles: roles,
      });
    }
    setTableDataSrc(data);
  };

  const createNewElection = () => {
    console.log("createNewElection");
    setIsModalVisible(true);
  };

  const onFinish = async () => {
    setIsCreating(true);
    const result = tx(
      writeContracts.Diplomacy.newElection(newElecName, newElecAllocatedFunds, newElecAllocatedVotes, newElecAddr),
      update => {
        console.log("📡 Transaction Update:", update);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
        } else {
          console.log("update error ", update.status);
          setIsCreating(false);
        }
      },
    );
    // console.log("awaiting metamask/web3 confirm result...", result);
    // console.log(await result);
  };

  return (
    <>
      <Modal title="Election Info" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: false }}
          onFinish={onFinish}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input election name!" }]}>
            <Input
              placeholder="Election Name"
              onChange={e => {
                setNewElecName(e.target.value);
              }}
            />
          </Form.Item>
          <Form.Item name="funds" label="Funds" rules={[{ required: true, message: "Please input funds!" }]}>
            <Input
              placeholder="Funds (ETH)"
              onChange={e => {
                setNewElecAllocatedFunds(toWei(e.target.value));
              }}
            />
          </Form.Item>
          <Form.Item
            name="votes"
            label="N Votes"
            rules={[{ required: true, message: "Please input number of votes!" }]}
          >
            <Input
              placeholder="Number of Votes per Candidate"
              onChange={e => {
                setNewElecAllocatedVotes(e.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="Candidates" name="addr">
            <Select
              mode="multiple"
              //   style={{ width: "100%" }}
              placeholder="Add multiple candidates"
              onChange={handleAddrSelected}
            >
              {newElecWorkers}
            </Select>
          </Form.Item>
          <Form.Item label="Custom" name="custom">
            <Space>
              <Input
                placeholder="Enter address"
                value={customAddress}
                onChange={e => {
                  setCustomAddress(e.target.value);
                }}
              />
              <Button type="primary" size="small" onClick={() => addCustomAddr()}>
                +
              </Button>
            </Space>
          </Form.Item>
          <Form.Item>
            {!isCreating && (
              <Button type="primary" htmlType="submit" className="login-form-button">
                Create new
              </Button>
            )}
            {isCreating && (
              <Button type="primary" size="small" loading>
                Creating
              </Button>
            )}
          </Form.Item>
        </Form>
      </Modal>
      <div className="elections-view" style={{ border: "1px solid #cccccc", padding: 16, width: 800, margin: "auto", marginTop: 64 }}>
        <PageHeader
          ghost={false}
          title="Elections"
          subTitle={`Count: ${numElections}`}
          extra={[
            <Button style={{ margin: 4 }} onClick={() => createNewElection()}>
              + Create Election
            </Button>,
          ]}
        >
          {/* <h2>Elections</h2>
          <div>Number of elections: {numElections}</div> */}
          <Divider />
          <Table dataSource={tableDataSrc} columns={columns} />
        </PageHeader>
      </div>
    </>
  );
}
