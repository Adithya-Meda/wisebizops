export function parseTerraformDeterministically(text: string) {
  const resources: any[] = [];
  
  // 1. EC2 Instances
  const ec2Matches = text.matchAll(/resource\s+"aws_instance"\s+"([^"]+)"\s*\{([\s\S]*?)(?=\n\s*resource|$)/g);
  for (const match of ec2Matches) {
    const typeMatch = match[2].match(/instance_type\s*=\s*"([^"]+)"/);
    const inst = typeMatch ? typeMatch[1] : "t3.medium";
    
    // Attempt to guess OS from AMI data lookups or comments, otherwise fallback to Linux/macOS rules
    let os = "Linux";
    if (inst.startsWith("mac")) os = "macOS";
    
    const osCommentMatch = match[2].match(/#\s*os:\s*(windows|linux|macos)/i);
    if (osCommentMatch) {
      os = osCommentMatch[1].toLowerCase() === "windows" ? "Windows" : (osCommentMatch[1].toLowerCase() === "macos" ? "macOS" : "Linux");
    }

    resources.push({ name: `Amazon EC2 (${inst}, ${os})`, quantity: 1 });
    
    // Parse ALL root block devices and EBS block devices
    const blockDevices = match[2].matchAll(/(?:root_block_device|ebs_block_device)\s*\{([\s\S]*?)\}/g);
    for (const device of blockDevices) {
      const volTypeMatch = device[1].match(/volume_type\s*=\s*"([^"]+)"/);
      const volType = volTypeMatch ? volTypeMatch[1] : "gp2";
      const volSizeMatch = device[1].match(/volume_size\s*=\s*(\d+)/);
      const volSize = volSizeMatch ? parseInt(volSizeMatch[1]) : 8;
      
      resources.push({ name: `Amazon EBS (${volType})`, quantity: 1, storage: volSize });
    }
  }

  // 2. RDS Instances
  const rdsMatches = text.matchAll(/resource\s+"aws_db_instance"\s+"([^"]+)"\s*\{([\s\S]*?)(?=\n\s*resource|$)/g);
  for (const match of rdsMatches) {
    const classMatch = match[2].match(/instance_class\s*=\s*"([^"]+)"/);
    const inst = classMatch ? classMatch[1] : "db.t3.micro";
    const engineMatch = match[2].match(/engine\s*=\s*"([^"]+)"/);
    const engine = engineMatch ? (engineMatch[1].toLowerCase().includes("postgres") ? "PostgreSQL" : "MySQL") : "PostgreSQL";
    
    const multiAzMatch = match[2].match(/multi_az\s*=\s*(true|false)/i);
    const deployment = (multiAzMatch && multiAzMatch[1].toLowerCase() === "true") ? "Multi-AZ" : "Single-AZ";
    
    const storageMatch = match[2].match(/allocated_storage\s*=\s*(\d+)/);
    const storage = storageMatch ? parseInt(storageMatch[1]) : undefined;
    
    resources.push({ name: `Amazon RDS (${engine}, ${inst}, ${deployment})`, quantity: 1 });
    
    if (storage) {
      const volTypeMatch = match[2].match(/storage_type\s*=\s*"([^"]+)"/);
      const volType = volTypeMatch ? volTypeMatch[1] : "gp2";
      resources.push({ name: `Amazon EBS (${volType})`, quantity: 1, storage });
    }
  }

  // 3. S3 Buckets
  const s3Matches = text.matchAll(/resource\s+"aws_s3_bucket"\s+"([^"]+)"\s*\{([\s\S]*?)(?=\n\s*resource|$)/g);
  for (const match of s3Matches) {
    // Check for explicit glacier lifecycle rules or comments
    const storageClassMatch = match[2].match(/storage_class\s*=\s*"([^"]+)"/i);
    const storageClass = storageClassMatch ? storageClassMatch[1].toUpperCase() : "STANDARD";
    
    let mappedClass = "Standard";
    if (storageClass.includes("GLACIER")) mappedClass = "Glacier";
    else if (storageClass.includes("INTELLIGENT")) mappedClass = "Intelligent-Tiering";
    
    resources.push({ name: `Amazon S3 (${mappedClass})`, quantity: 1, storage: 10 });
  }

  // 4. Elastic Load Balancing
  const lbMatches = text.matchAll(/resource\s+"aws_lb"\s+"([^"]+)"\s*\{([\s\S]*?)(?=\n\s*resource|$)/g);
  for (const match of lbMatches) {
    const typeMatch = match[2].match(/load_balancer_type\s*=\s*"([^"]+)"/);
    let lbType = "Application";
    if (typeMatch) {
      if (typeMatch[1].toLowerCase() === "network") lbType = "Network";
      else if (typeMatch[1].toLowerCase() === "gateway") lbType = "Gateway";
    }
    resources.push({ name: `Elastic Load Balancing (${lbType})`, quantity: 1 });
  }

  // 5. EKS
  const eksMatches = text.matchAll(/resource\s+"aws_eks_cluster"\s+"([^"]+)"\s*\{([\s\S]*?)(?=\n\s*resource|$)/g);
  for (const match of eksMatches) {
    resources.push({ name: `Amazon EKS (Standard)`, quantity: 1 });
  }
  
  const fargateMatches = text.matchAll(/resource\s+"aws_eks_fargate_profile"\s+"([^"]+)"\s*\{([\s\S]*?)(?=\n\s*resource|$)/g);
  for (const match of fargateMatches) {
    resources.push({ name: `Amazon EKS (Fargate)`, quantity: 1 });
  }

  return resources;
}


