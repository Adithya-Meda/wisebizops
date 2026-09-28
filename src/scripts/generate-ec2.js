const { EC2Client, paginateDescribeInstanceTypes } = require("@aws-sdk/client-ec2");
const fs = require('fs');

async function generate() {
    const client = new EC2Client({ region: 'us-east-1' });
    const families = {};
    
    for await (const page of paginateDescribeInstanceTypes({ client }, {})) {
        for (const type of page.InstanceTypes) {
            const [family, size] = type.InstanceType.split('.');
            if (!size) {
               if (type.InstanceType.startsWith("mac")) {
                   // e.g. mac-m4
                   const family = type.InstanceType;
                   families[family] = { arch: "mac", sizes: new Set(["metal"]), supportedOs: ["macOS"] };
               }
               continue; 
            }
            
            if (!families[family]) {
                const arch = type.ProcessorInfo.SupportedArchitectures.includes('arm64') ? 'arm' :
                             type.ProcessorInfo.SupportedArchitectures.includes('x86_64') ? 'x86' : 'mac';
                             
                const supportedOs = [];
                if (arch === 'mac') {
                    supportedOs.push('macOS');
                } else {
                    supportedOs.push('Linux', 'Ubuntu', 'RHEL');
                    if (arch !== 'arm') supportedOs.push('Windows');
                }
                
                families[family] = {
                    arch: arch,
                    sizes: new Set(),
                    supportedOs: supportedOs
                };
            }
            families[family].sizes.add(size);
        }
    }
    
    const finalFamilies = {};
    Object.keys(families).sort().forEach(f => {
        finalFamilies[f] = {
            arch: families[f].arch,
            sizes: Array.from(families[f].sizes).sort(),
            supportedOs: families[f].supportedOs
        };
        if (families[f].arch === 'mac') {
             finalFamilies[f].supportedRegions = ["us-east-1", "us-east-2", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1"];
        }
    });
    
    const archData = require('../lib/aws-architectures.json');
    archData.ec2.instanceFamilies = finalFamilies;
    fs.writeFileSync('src/lib/aws-architectures.json', JSON.stringify(archData, null, 2));
    console.log(`Generated ${Object.keys(finalFamilies).length} EC2 families.`);
}

generate().catch(console.error);
