"use client";
import { CustomSelect } from "@/components/custom-select";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

type ConfigOption = { label: string; options: string[] };
const serviceConfigs: Record<string, ConfigOption[]> = {
  "Amazon EC2": [
    { label: "Instance Type", options: ["t3.micro", "t3.medium", "m5.large", "m5.xlarge", "c5.large", "c5.xlarge", "r5.large"] },
    { label: "Operating System", options: ["Linux", "Windows", "Ubuntu", "RHEL"] }
  ],
  "Amazon RDS": [
    { label: "Database Engine", options: ["PostgreSQL", "MySQL", "Aurora", "MariaDB", "Oracle", "SQL Server"] },
    { label: "Instance Class", options: ["db.t3.micro", "db.t3.medium", "db.m5.large", "db.r5.large", "db.r5.xlarge"] },
    { label: "Deployment", options: ["Single-AZ", "Multi-AZ"] }
  ],
  "Amazon S3": [
    { label: "Storage Class", options: ["Standard", "Intelligent-Tiering", "Standard-IA", "One Zone-IA", "Glacier"] }
  ],
  "AWS Lambda": [
    { label: "Architecture", options: ["x86_64", "arm64"] },
    { label: "Memory", options: ["128MB", "512MB", "1024MB", "2048MB", "4096MB"] }
  ],
  "Amazon DynamoDB": [
    { label: "Capacity Mode", options: ["On-Demand", "Provisioned"] }
  ],
  "Amazon EKS": [
      { label: "Cluster Type", options: ["Standard", "Fargate"] }
    ],
    "Amazon EBS": [
      { label: "Volume Type", options: ["gp3", "gp2", "io1", "io2", "st1", "sc1"] }
    ],
    "Elastic Load Balancing": [
      { label: "Load Balancer Type", options: ["Application", "Network", "Classic", "Gateway"] }
    ],
    "Amazon VPC": [
      { label: "Resource Type", options: ["NAT Gateway", "Endpoint"] }
    ]
};

const defaultServices = [
  "Amazon EC2", "Amazon RDS", "Amazon S3", "Amazon EBS", "Elastic Load Balancing", "Amazon VPC",
  "AWS Lambda", "Amazon DynamoDB", "Amazon EKS",
  "Amazon ECS", "Amazon CloudFront", "Amazon API Gateway",
  "Amazon ElastiCache", "Amazon SQS", "Amazon SNS",
  "Amazon Route 53", "AWS Fargate", "AWS WAF", "AWS KMS"
];

export default function AwsEstimator() {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [result, setResult] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedService, setSelectedService] = useState(defaultServices[0]);
  const [selectedConfig, setSelectedConfig] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [storageSize, setStorageSize] = useState<number | undefined>(undefined);
  const [addedResources, setAddedResources] = useState<{name: string, quantity: number, storage?: number}[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  // Local storage caching removed per user request

  useEffect(() => {
    const configs = serviceConfigs[selectedService];
    if (configs) {
      const defaults: Record<string, string> = {};
      configs.forEach(c => (defaults[c.label] = c.options[0]));
      setSelectedConfig(defaults);
    } else {
      setSelectedConfig({});
    }
    setQuantity(1);
  }, [selectedService]);

  // Reactive calculation
  useEffect(() => {
    if (addedResources.length > 0) {
      setIsProcessing(true);
      fetch('/api/aws/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: awsRegion, resources: addedResources })
      })
      .then(res => res.json())
      .then(data => {
        setIsProcessing(false);
        if (!data.error) {
          setResult(data);
          if (data.exchangeRates) {
            setExchangeRates({ USD: 1, ...data.exchangeRates });
          }
        }
      })
      .catch(err => {
        setIsProcessing(false);
        console.error(err);
      });
    } else if (addedResources.length === 0) {
      setResult(null);
    }
  }, [awsRegion, addedResources, activeTab]);

  
  const parseTerraformDeterministically = (text: string) => {
    const resources: any[] = [];
    
    const ec2Matches = text.matchAll(/resource\s+"aws_instance"\s+"([^"]+)"\s+\{([\s\S]*?)\}/g);
    for (const match of ec2Matches) {
      const typeMatch = match[2].match(/instance_type\s*=\s*"([^"]+)"/);
      const inst = typeMatch ? typeMatch[1] : "t3.medium";
      resources.push({ name: "Amazon EC2 (${inst}, Linux)", quantity: 1 });
      
      const ebsMatch = match[2].match(/volume_size\s*=\s*(\d+)/);
      if (ebsMatch) resources.push({ name: "Amazon EBS (gp3)", quantity: 1, storage: parseInt(ebsMatch[1]) });
    }

    const rdsMatches = text.matchAll(/resource\s+"aws_db_instance"\s+"([^"]+)"\s+\{([\s\S]*?)\}/g);
    for (const match of rdsMatches) {
      const classMatch = match[2].match(/instance_class\s*=\s*"([^"]+)"/);
      const inst = classMatch ? classMatch[1] : "db.t3.micro";
      const engineMatch = match[2].match(/engine\s*=\s*"([^"]+)"/);
      const engine = engineMatch ? (engineMatch[1].toLowerCase().includes('postgres') ? 'PostgreSQL' : 'MySQL') : 'PostgreSQL';
      resources.push({ name: "Amazon RDS (${engine}, ${inst}, Single-AZ)", quantity: 1 });
    }

    const s3Matches = text.matchAll(/resource\s+"aws_s3_bucket"/g);
    for (const match of s3Matches) { resources.push({ name: "Amazon S3 (Standard)", quantity: 1 }); }

    const eksMatches = text.matchAll(/resource\s+"aws_eks_cluster"/g);
    for (const match of eksMatches) { resources.push({ name: "Amazon EKS (Standard)", quantity: 1 }); }

    const lbMatches = text.matchAll(/resource\s+"aws_lb"\s+"([^"]+)"\s+\{([\s\S]*?)\}/g);
    for (const match of lbMatches) {
      let displayName = "Elastic Load Balancing";
      const typeMatch = match[2].match(/load_balancer_type\s*=\s*"([^"]+)"/);
      if (typeMatch && typeMatch[1] === "network") displayName += " (Network)";
      else displayName += " (Application)";
      resources.push({ name: displayName, quantity: 1 });
    }

    const vpcNatMatches = text.matchAll(/resource\s+"aws_nat_gateway"/g);
    for (const match of vpcNatMatches) { resources.push({ name: "Amazon VPC (NAT Gateway)", quantity: 1 }); }

    setAddedResources(resources);
  };

