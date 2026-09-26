"use client";
import { CustomSelect } from "@/components/custom-select";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

type ConfigOption = { label: string; options: string[] };
const serviceConfigs: Record<string, ConfigOption[]> = {
  "Amazon EC2": [
    { label: "Instance Type", options: ["t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "t3.2xlarge", "t4g.micro", "t4g.small", "t4g.medium", "t4g.large", "t4g.xlarge", "t4g.2xlarge", "m5.large", "m5.xlarge", "m5.2xlarge", "m5.4xlarge", "m6g.large", "m6g.xlarge", "m6g.2xlarge", "m6g.4xlarge", "m7i.large", "m7i.xlarge", "m7i.2xlarge", "m7i.4xlarge", "c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge", "c6g.large", "c6g.xlarge", "c6g.2xlarge", "c6g.4xlarge", "c7g.large", "c7g.xlarge", "c7g.2xlarge", "c7g.4xlarge", "r5.large", "r5.xlarge", "r5.2xlarge", "r5.4xlarge", "r6g.large", "r6g.xlarge", "r6g.2xlarge", "r6g.4xlarge", "r7g.large", "r7g.xlarge", "r7g.2xlarge", "r7g.4xlarge", "mac1.metal", "mac2.metal"] },
    { label: "Operating System", options: ["Linux", "Windows", "Ubuntu", "RHEL", "macOS"] }
  ],
  "Amazon RDS": [
    { label: "Database Engine", options: ["PostgreSQL", "MySQL", "Aurora", "MariaDB", "Oracle", "SQL Server"] },
    { label: "Instance Class", options: ["db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large", "db.t3.xlarge", "db.t4g.micro", "db.t4g.small", "db.t4g.medium", "db.t4g.large", "db.t4g.xlarge", "db.m5.large", "db.m5.xlarge", "db.m5.2xlarge", "db.m5.4xlarge", "db.m6g.large", "db.m6g.xlarge", "db.m6g.2xlarge", "db.m6g.4xlarge", "db.r5.large", "db.r5.xlarge", "db.r5.2xlarge", "db.r5.4xlarge", "db.r6g.large", "db.r6g.xlarge", "db.r6g.2xlarge", "db.r6g.4xlarge"] },
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

  useEffect(() => {
    // UI Validation: Strictly enforce that macOS can only be selected with Mac bare-metal instances (and vice versa)
    if (selectedService === "Amazon EC2" && selectedConfig["Operating System"] && selectedConfig["Instance Type"]) {
        const isMacOS = selectedConfig["Operating System"] === "macOS";
        const isMacInst = selectedConfig["Instance Type"].startsWith("mac");

        if (isMacOS && !isMacInst) {
            // Force OS back to Linux if user selects macOS on a non-Mac instance
            setSelectedConfig(prev => ({...prev, "Operating System": "Linux"}));
        } else if (!isMacOS && isMacInst) {
            // Force OS to macOS if user selects a Mac instance
            setSelectedConfig(prev => ({...prev, "Operating System": "macOS"}));
        }
    }
  }, [selectedConfig, selectedService]);

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
          const os = inst.includes("mac") ? "macOS" : "Linux";
          resources.push({ name: `Amazon EC2 (${inst}, ${os})`, quantity: 1 });
        
        const ebsMatch = match[2].match(/volume_size\s*=\s*(\d+)/);
        if (ebsMatch) resources.push({ name: `Amazon EBS (gp3)`, quantity: 1, storage: parseInt(ebsMatch[1]) });
      }

    const rdsMatches = text.matchAll(/resource\s+"aws_db_instance"\s+"([^"]+)"\s+\{([\s\S]*?)\}/g);
      for (const match of rdsMatches) {
        const classMatch = match[2].match(/instance_class\s*=\s*"([^"]+)"/);
        const inst = classMatch ? classMatch[1] : "db.t3.micro";
        const engineMatch = match[2].match(/engine\s*=\s*"([^"]+)"/);
        const engine = engineMatch ? (engineMatch[1].toLowerCase().includes("postgres") ? "PostgreSQL" : "MySQL") : "PostgreSQL";
        resources.push({ name: `Amazon RDS (${engine}, ${inst}, Single-AZ)`, quantity: 1 });
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

    if (resources.length === 0) {
      toast.error("No supported AWS resources found in Terraform code.");
    } else {
      setAddedResources(() => {
        const grouped = resources.reduce((acc: any[], curr: any) => {
          const existing = acc.find((r: any) => r.name === curr.name && r.storage === curr.storage);
          if (existing) {
            existing.quantity += curr.quantity;
          } else {
            acc.push({ ...curr });
          }
          return acc;
        }, []);
        return grouped;
      });
      toast.success(`Successfully parsed resources!`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) parseTerraformDeterministically(text);
      };
      reader.readAsText(file);
    };

  
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) parseTerraformDeterministically(text);
    };
    reader.readAsText(file);
  };

  const handleAddResource = () => {
    const configs = serviceConfigs[selectedService];
    let displayName = selectedService;
    
    if (configs && Object.keys(selectedConfig).length > 0) {
      const configStrings = configs.map(c => selectedConfig[c.label]).join(", ");
      displayName = `${selectedService} (${configStrings})`;
    }

    const existingIndex = addedResources.findIndex(r => r.name === displayName);
    if (existingIndex >= 0) {
      const newResources = [...addedResources];
      newResources[existingIndex] = { ...newResources[existingIndex], quantity: quantity };
      setAddedResources(newResources);
      
    } else {
      setAddedResources([...addedResources, { name: displayName, quantity, storage: storageSize }]);
      
    }
  };

  const handleRemoveResource = (index: number) => {
    const newResources = [...addedResources];
    newResources.splice(index, 1);
    setAddedResources(newResources);
  };

  const handleExportCSV = () => {
    if (!result || !result.breakdown) return;
    const rate = exchangeRates[currency] || 1;
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Create a stylized metadata header for the CSV
    const metadata = `"WiseBizOps - AWS Cost Estimate Report"\n"Generated On:","${dateStr}"\n"AWS Region:","${awsRegion}"\n"Currency:","${currency}"\n\n`;
    
    const headers = `Service,Quantity,Unit Cost (${currency}),Total Cost (${currency})\n`;
    const rows = result.breakdown.map((item: any) => {
      const unit = ((item.unitCost || item.cost) * rate).toFixed(2);
      const total = (item.cost * rate).toFixed(2);
      return `"${item.service}",${item.quantity || 1},${unit},${total}`;
    }).join("\n");
    
    const grandTotal = (result.total * rate).toFixed(2);
    const csv = metadata + headers + rows + `\n\n"GRAND TOTAL",,,${grandTotal}`;
    
    navigator.clipboard.writeText(csv).then(() => {
       toast.success("Copied CSV data to clipboard!");
    }).catch(() => {});

    try {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aws-estimate-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
  const formatCost = (usdAmount: number) => {
    const converted = usdAmount * (exchangeRates[currency] || 1);
    return `${currencySymbols[currency] || '$'}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-primary-600 dark:text-primary-500 mb-2 flex items-center gap-3 transition-colors">
                <div className="w-12 h-12 rounded flex items-center justify-center bg-transparent mr-2"><img src="/calc-3d.png?v=5" style={{ filter: "hue-rotate(var(--icon-hue))" }} alt="Calculator" className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(var(--primary-rgb),0.4)]" /></div>
              AWS Cost Estimator
          </h1>
          <p className="text-sm text-zinc-500 ml-11">Forecast your cloud spend before deployment.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-500">Region:</label>
            <CustomSelect options={[
      {value: "us-east-1", label: "US East (N. Virginia)"},
      {value: "us-east-2", label: "US East (Ohio)"},
      {value: "us-west-1", label: "US West (N. California)"},
      {value: "us-west-2", label: "US West (Oregon)"},
      {value: "ca-central-1", label: "Canada (Central)"},
      {value: "eu-west-1", label: "Europe (Ireland)"},
      {value: "eu-west-2", label: "Europe (London)"},
      {value: "eu-west-3", label: "Europe (Paris)"},
      {value: "eu-central-1", label: "Europe (Frankfurt)"},
      {value: "eu-north-1", label: "Europe (Stockholm)"},
      {value: "eu-south-1", label: "Europe (Milan)"},
      {value: "ap-southeast-1", label: "Asia Pacific (Singapore)"},
      {value: "ap-southeast-2", label: "Asia Pacific (Sydney)"},
      {value: "ap-southeast-3", label: "Asia Pacific (Jakarta)"},
      {value: "ap-northeast-1", label: "Asia Pacific (Tokyo)"},
      {value: "ap-northeast-2", label: "Asia Pacific (Seoul)"},
      {value: "ap-northeast-3", label: "Asia Pacific (Osaka)"},
      {value: "ap-south-1", label: "Asia Pacific (Mumbai)"},
      {value: "ap-south-2", label: "Asia Pacific (Hyderabad)"},
      {value: "ap-east-1", label: "Asia Pacific (Hong Kong)"},
      {value: "sa-east-1", label: "South America (Sao Paulo)"},
      {value: "me-south-1", label: "Middle East (Bahrain)"},
      {value: "me-central-1", label: "Middle East (UAE)"},
      {value: "af-south-1", label: "Africa (Cape Town)"}
    ]} value={awsRegion} onChange={setAwsRegion} menuClassName="[&>div>div]:text-xs [&>div>div]:py-1.5 [&>div]:max-h-[300px]" className="w-48 appearance-none rounded-lg border border-transparent bg-black/[0.03] dark:bg-black/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] px-3 py-1.5 backdrop-blur-sm text-xs font-bold text-primary-600 dark:text-primary-400 focus:outline-none transition-colors" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-500">Currency:</label>
            <CustomSelect options={[{value: "INR", label: "INR (₹)"}, {value: "EUR", label: "EUR (€)"}, {value: "USD", label: "USD ($)"}, {value: "GBP", label: "GBP (£)"}, {value: "JPY", label: "JPY (¥)"}]} value={currency} onChange={setCurrency} menuClassName="[&>div>div]:text-xs [&>div>div]:py-1.5" className="w-24 appearance-none rounded-lg border border-transparent bg-black/[0.03] dark:bg-black/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] px-3 py-1.5 backdrop-blur-sm text-xs font-bold text-primary-600 dark:text-primary-400 focus:outline-none transition-colors" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white/70 to-white/30 dark:from-[#111]/70 dark:to-[#050505]/40 backdrop-blur-2xl rounded-2xl border-x border-b border-white/60 dark:border-white/10 border-t-2 border-t-primary-400 dark:border-t-primary-500 shadow-[0_-4px_20px_rgba(var(--primary-rgb),0.15),0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] relative p-6 transition-colors  relative">
            {isProcessing && (
               <div className="absolute top-0 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                 <div className="w-1/3 h-full bg-black dark:bg-white animate-[pulse_1s_ease-in-out_infinite] translate-x-[-100%]"></div>
               </div>
            )}
            
            <div className="flex border-b border-zinc-200 dark:border-white/10 mb-6 gap-6 transition-colors">
              <button onClick={() => setActiveTab("tf")} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "tf" ? "border-primary-600 dark:border-primary-400 text-primary-700 dark:text-primary-300" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>Upload .tf</button>
              <button onClick={() => setActiveTab("manual")} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "manual" ? "border-primary-600 dark:border-primary-400 text-primary-700 dark:text-primary-300" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>Manual Builder</button>
              <button onClick={() => setActiveTab("ai")} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "ai" ? "border-primary-600 dark:border-primary-400 text-primary-700 dark:text-primary-300" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>AI Architect</button>
            </div>

            <div className="relative">
              {activeTab === "tf" && (
                <div onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer group ${isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-zinc-300 dark:border-white/20 bg-white dark:bg-white/[0.01] hover:bg-zinc-50 dark:hover:bg-white/[0.03]'} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".tf,.tfstate" />
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${isDragging ? 'bg-primary-500 scale-110 shadow-lg' : 'bg-primary-600 hover:bg-primary-500 shadow-[inset_3px_3px_6px_rgba(255,255,255,0.3),inset_-3px_-3px_6px_rgba(var(--primary-rgb),0.8),4px_4px_10px_rgba(0,0,0,0.15)] group-hover:scale-110'} text-white`}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <h3 className="text-sm font-medium text-primary-600 dark:text-primary-500 mb-1 transition-colors">{isDragging ? 'Drop file to parse' : (isProcessing ? 'Processing...' : 'Upload or Drop .tf Files')}</h3>
                    <p className="text-[11px] text-zinc-500 mb-2">Click or drag and drop your Terraform file.</p>
                    <div className="mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-lg text-left text-[11px] text-zinc-500 dark:text-zinc-400">
                      <strong>Supported Auto-Parsing:</strong> EC2 Instances (w/ dependent EBS root volumes), RDS Databases, S3 Buckets, EKS Clusters, ALBs/NLBs, and NAT Gateways.
                    </div>
                  </div>
              )}

              {activeTab === "manual" && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2 transition-colors">Select AWS Service</label>
                    <CustomSelect options={defaultServices.map(svc => ({value: svc, label: svc}))} value={selectedService} onChange={setSelectedService} className="w-full appearance-none rounded-2xl border border-primary-400/50 dark:border-primary-500/40 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-black/[0.03] dark:bg-black/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] px-3 py-2 backdrop-blur-sm text-sm text-zinc-900 dark:text-zinc-300 focus:outline-none transition-all" />
                  </div>

                  {serviceConfigs[selectedService] && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-200 dark:border-white/10">
                      {serviceConfigs[selectedService].map((conf, idx) => (
                        <div key={idx}>
                          <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 transition-colors">{conf.label}</label>
                          <CustomSelect options={conf.options.map((opt: string) => ({value: opt, label: opt}))} value={selectedConfig[conf.label] || ""} onChange={(val: string) => setSelectedConfig({...selectedConfig, [conf.label]: val})} className="w-full appearance-none rounded-2xl border border-primary-400/50 dark:border-primary-500/40 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-black/[0.03] dark:bg-black/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] px-3 py-1.5 backdrop-blur-sm text-xs text-zinc-900 dark:text-zinc-300 focus:outline-none transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2 items-end pt-2">
                    {(selectedService.includes("EBS") || selectedService.includes("S3") || selectedService.includes("RDS") || selectedService.includes("EFS") || selectedService.includes("FSx")) && (
                      <div className="w-24">
                        <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 transition-colors">GB Size</label>
                        <input 
                          type="number" 
                          min="1"
                          value={storageSize || ''}
                          placeholder="50"
                          onChange={(e) => setStorageSize(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full appearance-none rounded-2xl border border-primary-400/50 dark:border-primary-500/40 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-black/[0.03] dark:bg-black/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] px-3 py-1.5 backdrop-blur-sm text-sm text-zinc-900 dark:text-zinc-300 focus:outline-none transition-all"
                        />
                      </div>
                    )}
                    <div className="w-24">
                      <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 transition-colors">Quantity</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full appearance-none rounded-2xl border border-primary-400/50 dark:border-primary-500/40 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-black/[0.03] dark:bg-black/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] [&>option]:dark:bg-[#0a0a0a] px-3 py-1.5 backdrop-blur-sm text-sm text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all " 
                      />
                    </div>
                    <button onClick={handleAddResource} className="flex-1 px-4 py-2 h-[34px] bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-sm font-bold shadow-[inset_3px_3px_6px_rgba(255,255,255,0.3),inset_-3px_-3px_6px_rgba(var(--primary-rgb),0.8),4px_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[inset_5px_5px_8px_rgba(255,255,255,0.4),inset_-5px_-5px_8px_rgba(var(--primary-rgb),0.9),6px_6px_15px_rgba(0,0,0,0.2)] active:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(var(--primary-rgb),0.5),2px_2px_4px_rgba(0,0,0,0.05)] active:scale-95 transition-all duration-200">
                      Calculate Cost
                    </button>
                  </div>

                  
                </div>
              )}

              {activeTab === "ai" && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div>
                     <textarea 
                       value={aiPrompt}
                       onChange={(e) => setAiPrompt(e.target.value)}
                       placeholder="E.g., 'Highly available web app, 10k users/day, CDN...'" 
                       className="w-full min-h-[120px] rounded-2xl border border-primary-400/50 dark:border-primary-500/40 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-black/[0.03] dark:bg-black/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.5)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.03)] [&>option]:dark:bg-[#0a0a0a] px-3 py-2 backdrop-blur-sm text-sm text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-all resize-none "
                     ></textarea>
                  </div>
                  <button 
                    disabled={isProcessing || !aiPrompt}
                    onClick={() => {
                      setIsProcessing(true);
                      fetch('/api/aws/ai-architect', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: aiPrompt })
                      })
                      .then(res => res.json())
                      .then(data => {
                        if (data.error) throw new Error(data.error);
                        setAddedResources(() => {
        // Overwrite the cart with the fresh AI architecture instead of appending
        const grouped = data.resources.reduce((acc: any[], curr: any) => {
            // AI Validation: Intercept LLM hallucinations and enforce macOS constraints
            if (curr.name.startsWith("Amazon EC2 (")) {
                const match = curr.name.match(/Amazon EC2 \(([^,]+),\s*(.+)\)/);
                if (match) {
                    const os = match[1];
                    const inst = match[2];
                    const isMacInst = inst.startsWith("mac");
                    const isMacOS = os === "macOS";
                    if (isMacInst && !isMacOS) curr.name = `Amazon EC2 (macOS, ${inst})`;
                    else if (!isMacInst && isMacOS) curr.name = `Amazon EC2 (Linux, ${inst})`;
                }
            }
            const existing = acc.find((r: any) => r.name === curr.name && r.storage === curr.storage);
          if (existing) {
            existing.quantity += (curr.quantity || 1);
          } else {
            acc.push({ ...curr, quantity: curr.quantity || 1 });
          }
          return acc;
        }, []);
        return grouped;
    });
    toast.success("AI generated architecture successfully!");
                        // Note: The main useEffect will automatically trigger the estimate calculation now because addedResources changed
                      })
                      .catch(err => {
                        setIsProcessing(false);
                        toast.error(err.message || "Failed to generate architecture.");
                      });
                    }} 
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-sm font-bold shadow-[inset_3px_3px_6px_rgba(255,255,255,0.3),inset_-3px_-3px_6px_rgba(var(--primary-rgb),0.8),4px_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[inset_5px_5px_8px_rgba(255,255,255,0.4),inset_-5px_-5px_8px_rgba(var(--primary-rgb),0.9),6px_6px_15px_rgba(0,0,0,0.2)] active:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),inset_-1px_-1px_2px_rgba(var(--primary-rgb),0.5),2px_2px_4px_rgba(0,0,0,0.05)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isProcessing ? 'Generating...' : 'Generate & Estimate'}
                  </button>
                    <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-500/80 mt-2 font-medium">⚠️ AI can make mistakes. Please verify resource configurations and cost estimates before provisioning.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="">
          {result ? (
            <div className="bg-gradient-to-br from-white/70 to-white/30 dark:from-[#111]/70 dark:to-[#050505]/40 backdrop-blur-2xl rounded-2xl border-x border-b border-white/60 dark:border-white/10 border-t-2 border-t-primary-400 dark:border-t-primary-500 shadow-[0_-4px_20px_rgba(var(--primary-rgb),0.15),0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] relative p-6 transition-colors  h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col relative">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Estimated Monthly Cost</h3>
                <div className="flex gap-2">
                  <button onClick={() => {
                      const text = `ESTIMATED MONTHLY COST\n${formatCost(result.total)} / mo\n\nCost Breakdown:\n` + result.breakdown.map((item: any) => `- ${item.quantity}x ${item.service} ${item.storage ? `[${item.storage} GB]` : ""}: ${formatCost(item.cost)}`).join('\n');
                      navigator.clipboard.writeText(text);
                      toast.success("Copied to clipboard");
                  }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-500 text-white hover:scale-110 active:scale-95 transition-all shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.3),inset_-1.5px_-1.5px_3px_rgba(var(--primary-rgb),0.8),2px_2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(var(--primary-rgb),0.9),3px_3px_8px_rgba(0,0,0,0.2)] active:shadow-[inset_0.5px_0.5px_1px_rgba(255,255,255,0.2),inset_-0.5px_-0.5px_1px_rgba(var(--primary-rgb),0.5),1px_1px_2px_rgba(0,0,0,0.05)]" title="Copy to Clipboard">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                  <button onClick={handleExportCSV} className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-500 text-white hover:scale-110 active:scale-95 transition-all shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.3),inset_-1.5px_-1.5px_3px_rgba(var(--primary-rgb),0.8),2px_2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(var(--primary-rgb),0.9),3px_3px_8px_rgba(0,0,0,0.2)] active:shadow-[inset_0.5px_0.5px_1px_rgba(255,255,255,0.2),inset_-0.5px_-0.5px_1px_rgba(var(--primary-rgb),0.5),1px_1px_2px_rgba(0,0,0,0.05)]" title="Export to CSV">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                </div>
              </div>
              
              <div className="flex items-end gap-3 mb-1">
                <div className="text-4xl font-light text-primary-600 dark:text-primary-500 transition-colors">
                  {formatCost(result.total)}
                  <span className="text-sm font-medium text-zinc-500 ml-2">/ mo</span>
                </div>
                <div className="text-base font-medium text-zinc-400 dark:text-zinc-500 pb-1.5 transition-colors">
                  ≈ {formatCost(result.total * 12)}
                  <span className="text-xs font-normal ml-1">/ yr</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-8 max-w-[280px]">
                Estimates are for planning purposes only. Actual AWS billing may vary based on data transfer, taxes, and usage.
              </p>
              
              <h4 className="text-xs font-semibold text-primary-600 dark:text-primary-500 mb-4 pb-2 border-b border-zinc-200 dark:border-white/5 transition-colors">Cost Breakdown</h4>
              <ul className="space-y-3 flex-1 overflow-y-auto pl-1.5 pr-2 py-1">
                {result.breakdown.map((item: any, idx: number) => (
                  <li key={idx} className="flex justify-between items-center text-sm p-3 mb-2 rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-primary-400 dark:border-primary-500/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-md hover:scale-[1.01] transition-all group">
                    <div className="flex-1 flex flex-col justify-center">
                      <span className={`pr-4 leading-tight font-mono text-[13px] ${item.error ? 'text-red-500 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        <span className={`font-mono font-bold mr-1 ${item.error ? 'text-red-600 dark:text-red-500' : 'text-primary-600 dark:text-primary-400'}`}>{item.quantity}x</span> {item.service} {item.storage && <span className={`${item.error ? 'text-red-400' : 'text-zinc-500 dark:text-zinc-400'} text-[11px] ml-1`}>[{item.storage} GB]</span>}
                      </span>
                      {item.error && <span className="text-[10.5px] text-red-500/90 dark:text-red-400 mt-1 flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>{item.message}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-200 transition-colors whitespace-nowrap">{item.error ? '---' : formatCost(item.cost)}</span>
                      <button onClick={() => { const newRes = [...addedResources]; newRes.splice(idx, 1); setAddedResources(newRes); }} className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-full transition-colors opacity-40 hover:opacity-100 focus:opacity-100" title="Remove Resource">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-md rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-500/20 p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px] transition-colors">
               <div className="relative w-40 h-40 bg-black/[0.03] dark:bg-black/30 rounded-full flex items-center justify-center mb-6 overflow-hidden shadow-[inset_4px_4px_10px_rgba(0,0,0,0.06),inset_-4px_-4px_10px_rgba(255,255,255,0.6)] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5),inset_-4px_-4px_10px_rgba(255,255,255,0.03)]"><div className="absolute inset-0 bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.1)_1px,transparent_1px)] bg-[length:8px_8px] opacity-50"></div><div className="absolute top-0 left-0 right-0 h-1 bg-primary-400 shadow-[0_0_10px_var(--color-primary-400)] animate-[scan_2s_ease-in-out_infinite_alternate]"></div><img src="/calc-3d.png?v=5" style={{ filter: "hue-rotate(var(--icon-hue))" }} alt="AWS" className="w-16 h-16 relative z-10 object-contain drop-shadow-[0_4px_8px_rgba(var(--primary-rgb),0.4)]" /><style dangerouslySetInnerHTML={{__html: `@keyframes scan { from { transform: translateY(0); } to { transform: translateY(128px); } }`}} /></div>
               <p className="text-sm text-zinc-400">Provide an architecture to see the estimated cost breakdown here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}















 















































