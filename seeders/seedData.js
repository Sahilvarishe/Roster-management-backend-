import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import { connectDB, getDBStatus } from '../src/config/db.js';
import Pod from '../src/models/Pod.js';
import Employee from '../src/models/Employee.js';
import Brand from '../src/models/Brand.js';
import Process from '../src/models/Process.js';
import ResourceAssignment from '../src/models/ResourceAssignment.js';
import RosterAssignment from '../src/models/RosterAssignment.js';
import Roster from '../src/models/Roster.js';
import WeeklyOff from '../src/models/WeeklyOff.js';
import Holiday from '../src/models/Holiday.js';
import Leave from '../src/models/Leave.js';
import Conflict from '../src/models/Conflict.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// =========================================================================
// 1. OPERATIONAL PODS DEFINITIONS
// =========================================================================
export const seedPodsData = [
  {
    name: 'Customer Support Pod',
    lead: 'Aarav Sharma',
    leadId: 'EMP001',
    description: 'First-line omnichannel customer care, live chat triage, and SLA response monitoring.',
    brand: 'UrbanNest',
    brands: ['UrbanNest', 'GlowTheory', 'DailyDose'],
    shiftTiming: 'Day (08:00 - 17:00)',
    status: 'Active',
    requiredStaff: 6,
    currentStaff: 6,
    coverageRate: 96.5,
    coverageStatus: 'Optimal'
  },
  {
    name: 'Conversion Pod',
    lead: 'Priya Patel',
    leadId: 'EMP007',
    description: 'Abandoned cart checkout recovery, customer winback, and high-intent funnel conversion.',
    brand: 'HomeCraft',
    brands: ['HomeCraft', 'PureHarvest', 'LuxeLiving', 'Trendora'],
    shiftTiming: 'Day (08:00 - 17:00)',
    status: 'Active',
    requiredStaff: 6,
    currentStaff: 6,
    coverageRate: 94.0,
    coverageStatus: 'Optimal'
  },
  {
    name: 'Retention Pod',
    lead: 'Rohan Gupta',
    leadId: 'EMP013',
    description: 'Customer lifetime value extension, subscriber retention, and churn prevention programs.',
    brand: 'LuxeLiving',
    brands: ['LuxeLiving', 'FitFuel', 'SkinBloom', 'NutriVibe'],
    shiftTiming: 'Day (08:00 - 17:00)',
    status: 'Active',
    requiredStaff: 6,
    currentStaff: 6,
    coverageRate: 91.5,
    coverageStatus: 'Optimal'
  },
  {
    name: 'Operations Pod',
    lead: 'Ananya Deshmukh',
    leadId: 'EMP019',
    description: 'Logistics fulfillment, NDR resolution, carrier escalations, and shipping telemetry.',
    brand: 'EcoEssentials',
    brands: ['EcoEssentials', 'UrbanNest', 'Trendora', 'DailyDose'],
    shiftTiming: 'Day (08:00 - 17:00)',
    status: 'Active',
    requiredStaff: 6,
    currentStaff: 6,
    coverageRate: 95.0,
    coverageStatus: 'Optimal'
  },
  {
    name: 'Escalation Pod',
    lead: 'Vikram Malhotra',
    leadId: 'EMP025',
    description: 'Critical ticket handling, VIP executive complaints, billing disputes, and multi-brand escalations.',
    brand: 'StyleSphere',
    brands: ['StyleSphere', 'UrbanNest', 'GlowTheory', 'LuxeLiving'],
    shiftTiming: 'Day (08:00 - 17:00)',
    status: 'Active',
    requiredStaff: 6,
    currentStaff: 6,
    coverageRate: 93.5,
    coverageStatus: 'Optimal'
  }
];

// =========================================================================
// 2. 30 EMPLOYEES DATA (6 PER POD, WITH DESIGNATED POD LEADS)
// =========================================================================
export const seedEmployeesData = [
  // --- Pod 1: Customer Support Pod ---
  {
    employeeId: 'EMP001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@datastraw.io',
    designation: 'Support Operations Lead',
    pod: 'Customer Support Pod',
    brand: 'UrbanNest',
    process: 'Customer Support (CS)',
    joiningDate: '01-01-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11001',
    address: 'B-102, Palm Heights, Bandra West, Mumbai',
    skills: ['Queue Management', 'Omnichannel CS', 'Escalations']
  },
  {
    employeeId: 'EMP002',
    name: 'Rahul Sharma',
    email: 'employee@datastraw.io',
    designation: 'Support Executive',
    pod: 'Customer Support Pod',
    brand: 'GlowTheory',
    process: 'Customer Support (CS)',
    joiningDate: '15-02-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11002',
    address: '404, Sunrise Residency, Andheri East, Mumbai',
    skills: ['Customer Support', 'Chat Triage', 'SLA Adherence']
  },
  {
    employeeId: 'EMP003',
    name: 'Diya Mehta',
    email: 'diya.mehta@datastraw.io',
    designation: 'Customer Support Specialist',
    pod: 'Customer Support Pod',
    brand: 'FitFuel',
    process: 'Customer Support (CS)',
    joiningDate: '01-03-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11003',
    address: 'Flat 12A, Coral Bay, Worli, Mumbai',
    skills: ['Nutritional Product Support', 'Zendesk', 'Multi-Brand CS']
  },
  {
    employeeId: 'EMP004',
    name: 'Kabir Joshi',
    email: 'kabir.joshi@datastraw.io',
    designation: 'Customer Experience Executive',
    pod: 'Customer Support Pod',
    brand: 'PureHarvest',
    process: 'Customer Support (CS)',
    joiningDate: '10-04-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Friday'],
    phone: '+91 98201 11004',
    address: '701, Green Meadows, Powai, Mumbai',
    skills: ['Voice Support', 'Order Tracking', 'Customer Satisfaction']
  },
  {
    employeeId: 'EMP005',
    name: 'Ishita Sen',
    email: 'ishita.sen@datastraw.io',
    designation: 'Senior Support Executive',
    pod: 'Customer Support Pod',
    brand: 'Trendora',
    process: 'Customer Support (CS)',
    joiningDate: '01-05-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11005',
    address: '302, Lake View Apartments, Thane West',
    skills: ['Fashion Retailing CS', 'Sizing Guidance', 'Returns Processing']
  },
  {
    employeeId: 'EMP006',
    name: 'Arjun Nair',
    email: 'arjun.nair@datastraw.io',
    designation: 'L1 Support Specialist',
    pod: 'Customer Support Pod',
    brand: 'SkinBloom',
    process: 'Customer Support (CS)',
    joiningDate: '15-06-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Saturday'],
    phone: '+91 98201 11006',
    address: '503, Silver Arc, Vashi, Navi Mumbai',
    skills: ['Skincare Inquiries', 'Email Support', 'Refund Routing']
  },

  // --- Pod 2: Conversion Pod ---
  {
    employeeId: 'EMP007',
    name: 'Priya Patel',
    email: 'priya.patel@datastraw.io',
    designation: 'Conversion Team Lead',
    pod: 'Conversion Pod',
    brand: 'HomeCraft',
    process: 'Abandoned Cart Conversion (ACC)',
    joiningDate: '01-01-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11007',
    address: 'Flat 8B, Regency Park, Goregaon East, Mumbai',
    skills: ['Cart Recovery Strategy', 'WhatsApp Marketing', 'Lead Scoring']
  },
  {
    employeeId: 'EMP008',
    name: 'Rohan Verma',
    email: 'rohan.verma@datastraw.io',
    designation: 'Cart Recovery Specialist',
    pod: 'Conversion Pod',
    brand: 'NutriVibe',
    process: 'Abandoned Cart Conversion (ACC)',
    joiningDate: '20-02-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11008',
    address: '204, Omkar Tower, Malad West, Mumbai',
    skills: ['Outbound Calling', 'Discount Negotiation', 'Checkout Drop-off']
  },
  {
    employeeId: 'EMP009',
    name: 'Ananya Rao',
    email: 'ananya.rao@datastraw.io',
    designation: 'Checkout Optimization Executive',
    pod: 'Conversion Pod',
    brand: 'StyleSphere',
    process: 'Abandoned Cart Conversion (ACC)',
    joiningDate: '01-03-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Friday'],
    phone: '+91 98201 11009',
    address: '1501, Lodha Bellissimo, Mahalaxmi, Mumbai',
    skills: ['A/B Testing Messaging', 'Cart Remarketing', 'Payment Gateway Follow-up']
  },
  {
    employeeId: 'EMP010',
    name: 'Devansh Kapoor',
    email: 'devansh.kapoor@datastraw.io',
    designation: 'Conversion Analyst',
    pod: 'Conversion Pod',
    brand: 'EcoEssentials',
    process: 'Abandoned Cart Conversion (ACC)',
    joiningDate: '15-04-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11010',
    address: '1102, Kanakia Spaces, Kandivali East, Mumbai',
    skills: ['Conversion Analytics', 'Funnel Re-engagement', 'SMS Push Recovery']
  },
  {
    employeeId: 'EMP011',
    name: 'Tanvi Kulkarni',
    email: 'tanvi.kulkarni@datastraw.io',
    designation: 'Inbound Sales & ACC Executive',
    pod: 'Conversion Pod',
    brand: 'LuxeLiving',
    process: 'Abandoned Cart Conversion (ACC)',
    joiningDate: '01-05-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11011',
    address: '903, Raheja Tipco, Rani Sati Marg, Malad East',
    skills: ['Luxury Consultation', 'High-Ticket Recovery', 'Custom Quote Generation']
  },
  {
    employeeId: 'EMP012',
    name: 'Siddharth Jain',
    email: 'siddharth.jain@datastraw.io',
    designation: 'Cart Recovery Specialist',
    pod: 'Conversion Pod',
    brand: 'LuxeLiving',
    process: 'Abandoned Cart Conversion (ACC)',
    joiningDate: '15-06-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Saturday'],
    phone: '+91 98201 11012',
    address: '601, Shreepati Castle, Girgaon, Mumbai',
    skills: ['Lead Conversion', 'VIP Client Outreach', 'Payment Reconciliation']
  },

  // --- Pod 3: Retention Pod ---
  {
    employeeId: 'EMP013',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@datastraw.io',
    designation: 'Retention Lead',
    pod: 'Retention Pod',
    brand: 'LuxeLiving',
    process: 'Retention',
    joiningDate: '01-01-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11013',
    address: 'A-502, Oberoi Woods, Goregaon East, Mumbai',
    skills: ['Churn Prevention', 'Loyalty Tiering', 'Client LTV Optimization']
  },
  {
    employeeId: 'EMP014',
    name: 'Sneha Chatterjee',
    email: 'sneha.chatterjee@datastraw.io',
    designation: 'Loyalty & Retention Specialist',
    pod: 'Retention Pod',
    brand: 'DailyDose',
    process: 'Customer Support (CS)',
    joiningDate: '10-02-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11014',
    address: '1402, Godrej Prime, Chembur, Mumbai',
    skills: ['Subscription Retention', 'Special Perks Program', 'Customer Surveys']
  },
  {
    employeeId: 'EMP015',
    name: 'Aditya Singhania',
    email: 'aditya.singhania@datastraw.io',
    designation: 'Retention & Support Executive',
    pod: 'Retention Pod',
    brand: 'DailyDose',
    process: 'Customer Support (CS)',
    joiningDate: '01-03-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Friday'],
    phone: '+91 98201 11015',
    address: '802, Hiranandani Gardens, Powai, Mumbai',
    skills: ['Recurring Subscriptions', 'Feedback Analysis', 'Winback Incentives']
  },
  {
    employeeId: 'EMP016',
    name: 'Riya Saxena',
    email: 'riya.saxena@datastraw.io',
    designation: 'Customer Winback Executive',
    pod: 'Retention Pod',
    brand: 'DailyDose',
    process: 'Retention',
    joiningDate: '15-04-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11016',
    address: '304, Rustomjee Urbania, Majiwada, Thane',
    skills: ['Customer Re-activation', 'Churn Analytics', 'Net Promoter Score']
  },
  {
    employeeId: 'EMP017',
    name: 'Varun Pillai',
    email: 'varun.pillai@datastraw.io',
    designation: 'Churn Prevention Analyst',
    pod: 'Retention Pod',
    brand: 'FitFuel',
    process: 'Retention',
    joiningDate: '01-05-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Friday'],
    phone: '+91 98201 11017',
    address: '1203, Kalpataru Sparkle, Bandra East, Mumbai',
    skills: ['Cohort Retention', 'Nutritional Habit Retention', 'Automated Renewal']
  },
  {
    employeeId: 'EMP018',
    name: 'Pooja Bhatt',
    email: 'pooja.bhatt@datastraw.io',
    designation: 'Customer Lifecycle Specialist',
    pod: 'Retention Pod',
    brand: 'SkinBloom',
    process: 'Retention',
    joiningDate: '15-06-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Saturday'],
    phone: '+91 98201 11018',
    address: '702, Dosti Acres, Wadala East, Mumbai',
    skills: ['Beauty Regimen Follow-ups', 'Loyalty Rewards', 'VIP Outreach']
  },

  // --- Pod 4: Operations Pod ---
  {
    employeeId: 'EMP019',
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@datastraw.io',
    designation: 'Operations Lead',
    pod: 'Operations Pod',
    brand: 'EcoEssentials',
    process: 'Non-Delivery Report (NDR)',
    joiningDate: '01-01-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11019',
    address: 'B-1404, Marathon Nextgen, Lower Parel, Mumbai',
    skills: ['Logistics SOPs', 'Courier Reconciliation', 'RTO Reduction']
  },
  {
    employeeId: 'EMP020',
    name: 'Nikhil Choudhury',
    email: 'nikhil.choudhury@datastraw.io',
    designation: 'Logistics Coordinator',
    pod: 'Operations Pod',
    brand: 'UrbanNest',
    process: 'Non-Delivery Report (NDR)',
    joiningDate: '10-02-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11020',
    address: '501, Whispering Heights, Mindspace, Malad West',
    skills: ['Delivery Re-attempts', 'Address Validation', 'Last-mile Routing']
  },
  {
    employeeId: 'EMP021',
    name: 'Shruti Iyer',
    email: 'shruti.iyer@datastraw.io',
    designation: 'Dispatch Specialist',
    pod: 'Operations Pod',
    brand: 'PureHarvest',
    process: 'Non-Delivery Report (NDR)',
    joiningDate: '01-03-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Friday'],
    phone: '+91 98201 11021',
    address: '1104, Peninsula Heights, Prabhadevi, Mumbai',
    skills: ['Cold Chain Logistics', 'Perishable Goods Tracking', 'Customer Verification']
  },
  {
    employeeId: 'EMP022',
    name: 'Karan Merchant',
    email: 'karan.merchant@datastraw.io',
    designation: 'NDR Specialist',
    pod: 'Operations Pod',
    brand: 'Trendora',
    process: 'Non-Delivery Report (NDR)',
    joiningDate: '15-04-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11022',
    address: '803, Sea Princess, Juhu Tara Road, Mumbai',
    skills: ['NDR Workflows', 'Customer Rescheduling', 'Carrier Dispute Resolution']
  },
  {
    employeeId: 'EMP023',
    name: 'Neha Trivedi',
    email: 'neha.trivedi@datastraw.io',
    designation: 'Fulfillment Analyst',
    pod: 'Operations Pod',
    brand: 'HomeCraft',
    process: 'Non-Delivery Report (NDR)',
    joiningDate: '01-05-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11023',
    address: '202, Acme Ozone, Manpada, Thane West',
    skills: ['Heavy Cargo Tracking', 'Assembly Coordination', 'Delivery Escalations']
  },
  {
    employeeId: 'EMP024',
    name: 'Gaurav Bhatia',
    email: 'gaurav.bhatia@datastraw.io',
    designation: 'Supply Chain Operations Executive',
    pod: 'Operations Pod',
    brand: 'FitFuel',
    process: 'Non-Delivery Report (NDR)',
    joiningDate: '15-06-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Saturday'],
    phone: '+91 98201 11024',
    address: '1601, Crescent Bay, Parel, Mumbai',
    skills: ['Inventory Discrepancy', 'Order Rerouting', 'Courier SLA Claims']
  },

  // --- Pod 5: Escalation Pod ---
  {
    employeeId: 'EMP025',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@datastraw.io',
    designation: 'Escalation Lead',
    pod: 'Escalation Pod',
    brand: 'StyleSphere',
    process: 'Customer Support (CS)',
    joiningDate: '01-01-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11025',
    address: 'Penthouse 2, Ahuja Towers, Worli, Mumbai',
    skills: ['Crisis De-escalation', 'Executive Redressal', 'Legal & Regulatory Compliance']
  },
  {
    employeeId: 'EMP026',
    name: 'Simran Kaur',
    email: 'simran.kaur@datastraw.io',
    designation: 'Priority Escalation Specialist',
    pod: 'Escalation Pod',
    brand: 'UrbanNest',
    process: 'Customer Support (CS)',
    joiningDate: '10-02-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11026',
    address: '1002, Raheja Vivarea, Mahalaxmi, Mumbai',
    skills: ['Social Media Grievances', 'Chargeback Mitigation', 'Urgent Escalations']
  },
  {
    employeeId: 'EMP027',
    name: 'Harish Nambiar',
    email: 'harish.nambiar@datastraw.io',
    designation: 'Resolution Specialist',
    pod: 'Escalation Pod',
    brand: 'GlowTheory',
    process: 'Customer Support (CS)',
    joiningDate: '01-03-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Friday'],
    phone: '+91 98201 11027',
    address: '404, Sea Breeze, Bandra Bandstand, Mumbai',
    skills: ['Complex Order Investigation', 'Root Cause Analysis', 'Special Concessions']
  },
  {
    employeeId: 'EMP028',
    name: 'Meera Reddy',
    email: 'meera.reddy@datastraw.io',
    designation: 'Executive Escalations Specialist',
    pod: 'Escalation Pod',
    brand: 'LuxeLiving',
    process: 'Customer Support (CS)',
    joiningDate: '15-04-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Sunday'],
    phone: '+91 98201 11028',
    address: '701, Omkar 1973, Worli, Mumbai',
    skills: ['High-Net-Worth Client Support', 'Custom Damage Disputes', 'Escalated Replacements']
  },
  {
    employeeId: 'EMP029',
    name: 'Kunal Roy',
    email: 'kunal.roy@datastraw.io',
    designation: 'Critical Response Analyst',
    pod: 'Escalation Pod',
    brand: 'DailyDose',
    process: 'Non-Delivery Report (NDR)',
    joiningDate: '01-05-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Wednesday'],
    phone: '+91 98201 11029',
    address: '1302, Victoria Enclave, Byculla, Mumbai',
    skills: ['System Outage Comms', 'Refund Disputes', 'Escalated Delivery Failures']
  },
  {
    employeeId: 'EMP030',
    name: 'Shalini Mishra',
    email: 'shalini.mishra@datastraw.io',
    designation: 'Senior Escalation Executive',
    pod: 'Escalation Pod',
    brand: 'PureHarvest',
    process: 'Customer Support (CS)',
    joiningDate: '15-06-2025',
    status: 'Active',
    shift: 'Day (08:00 - 17:00)',
    weeklyOffDays: ['Saturday'],
    phone: '+91 98201 11030',
    address: '502, Phoenix Towers, Lower Parel, Mumbai',
    skills: ['Quality Assurance Feedback', 'Escalation Audits', 'Agent Coaching']
  }
];

// =========================================================================
// 3. 12 FICTIONAL D2C BRANDS
// =========================================================================
export const seedBrandsData = [
  {
    name: 'UrbanNest',
    code: 'URBN',
    color: '#3B82F6',
    status: 'Active',
    targetCoverage: 95,
    currentCoverage: 96.0,
    description: 'Modern minimalist furniture and home living decor direct-to-consumer brand.'
  },
  {
    name: 'GlowTheory',
    code: 'GLOW',
    color: '#EC4899',
    status: 'Active',
    targetCoverage: 92,
    currentCoverage: 94.5,
    description: 'Clean clinical skincare, active serums, and dermatology-backed formulations.'
  },
  {
    name: 'FitFuel',
    code: 'FUEL',
    color: '#10B981',
    status: 'Active',
    targetCoverage: 95,
    currentCoverage: 95.0,
    description: 'High-performance plant proteins, functional clean nutrition, and daily supplements.'
  },
  {
    name: 'PureHarvest',
    code: 'PURE',
    color: '#84CC16',
    status: 'Active',
    targetCoverage: 90,
    currentCoverage: 91.2,
    description: 'Farm-fresh certified organic pantry essentials and cold-pressed cooking oils.'
  },
  {
    name: 'Trendora',
    code: 'TRND',
    color: '#8B5CF6',
    status: 'Active',
    targetCoverage: 95,
    currentCoverage: 88.0,
    description: 'Fast-moving Gen Z apparel, sustainable streetwear, and curated seasonal drops.'
  },
  {
    name: 'SkinBloom',
    code: 'SBLM',
    color: '#F43F5E',
    status: 'Active',
    targetCoverage: 92,
    currentCoverage: 93.0,
    description: 'Botanical personal care, nourishing hair oils, and organic body essentials.'
  },
  {
    name: 'HomeCraft',
    code: 'HMCR',
    color: '#F59E0B',
    status: 'Active',
    targetCoverage: 90,
    currentCoverage: 92.5,
    description: 'Artisanal ceramic tableware, handcrafted textiles, and heritage brass accents.'
  },
  {
    name: 'NutriVibe',
    code: 'NVIB',
    color: '#06B6D4',
    status: 'Active',
    targetCoverage: 95,
    currentCoverage: 94.0,
    description: 'Custom vitamin packs, sleep wellness gummies, and gut biome health boosters.'
  },
  {
    name: 'StyleSphere',
    code: 'SSPH',
    color: '#6366F1',
    status: 'Active',
    targetCoverage: 90,
    currentCoverage: 90.0,
    description: 'Designer accessories, modular luxury travel bags, and polarized sunglasses.'
  },
  {
    name: 'EcoEssentials',
    code: 'ECOE',
    color: '#14B8A6',
    status: 'Active',
    targetCoverage: 95,
    currentCoverage: 96.0,
    description: 'Zero-waste home cleaners, biodegradable hygiene products, and eco kitchenware.'
  },
  // Multi-Resource Brands
  {
    name: 'LuxeLiving',
    code: 'LUXE',
    color: '#D97706',
    status: 'Active',
    targetCoverage: 98,
    currentCoverage: 97.5,
    description: 'Ultra-premium interior design furnishings, bespoke lighting, and marble art.'
  },
  {
    name: 'DailyDose',
    code: 'DLYD',
    color: '#2563EB',
    status: 'Active',
    targetCoverage: 95,
    currentCoverage: 89.0,
    description: 'Specialty subscription roast coffee, cold brew cans, and daily barista blends.'
  }
];

// =========================================================================
// 4. 4 OPERATIONAL PROCESSES WITH BRAND OPERATING RULES
// =========================================================================
export const seedProcessesData = [
  // --- UrbanNest (Single-Resource: EMP001 handles all 3 processes with varying rules) ---
  {
    name: 'Customer Support (CS)',
    brand: 'UrbanNest',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: '365-day operation', // Rule A: 365 Days
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '99.5%',
    description: '24/7 omnichannel order, delivery, and post-purchase query desk.'
  },
  {
    name: 'Abandoned Cart Conversion (ACC)',
    brand: 'UrbanNest',
    pod: 'Conversion Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off', // Rule C
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'Personalized WhatsApp checkout recovery and discount incentives.'
  },
  {
    name: 'Non-Delivery Report (NDR)',
    brand: 'UrbanNest',
    pod: 'Operations Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Public holidays off', // Rule B
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '98.0%',
    description: 'Immediate NDR re-attempts and customer address verification.'
  },

  // --- GlowTheory (Single-Resource: EMP002) ---
  {
    name: 'Customer Support (CS)',
    brand: 'GlowTheory',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: '365-day operation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '99.0%',
    description: 'Dermatological product guidance and order fulfillment support.'
  },
  {
    name: 'Abandoned Cart Conversion (ACC)',
    brand: 'GlowTheory',
    pod: 'Conversion Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '92.0%',
    description: 'Skincare routine cart completion follow-up outreach.'
  },
  {
    name: 'Non-Delivery Report (NDR)',
    brand: 'GlowTheory',
    pod: 'Operations Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'Cosmetics parcel dispatch issue management.'
  },

  // --- FitFuel (Single-Resource: EMP003) ---
  {
    name: 'Customer Support (CS)',
    brand: 'FitFuel',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: '365-day operation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '99.0%',
    description: 'Fitness supplement dosage and delivery tracking support.'
  },
  {
    name: 'Retention',
    brand: 'FitFuel',
    pod: 'Retention Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'Monthly protein subscription renewal and loyalty rewards.'
  },
  {
    name: 'Non-Delivery Report (NDR)',
    brand: 'FitFuel',
    pod: 'Operations Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'High-value fitness consignment delivery exception resolution.'
  },

  // --- PureHarvest (Single-Resource: EMP004) ---
  {
    name: 'Customer Support (CS)',
    brand: 'PureHarvest',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: '365-day operation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '98.5%',
    description: 'Organic pantry produce orders and packaging inquiries.'
  },
  {
    name: 'Abandoned Cart Conversion (ACC)',
    brand: 'PureHarvest',
    pod: 'Conversion Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '90.0%',
    description: 'First-time organic pantry buyer assistance.'
  },

  // --- Trendora (Single-Resource: EMP005) ---
  {
    name: 'Customer Support (CS)',
    brand: 'Trendora',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '97.0%',
    description: 'Fast fashion sizing, exchanges, and express dispatch support.'
  },
  {
    name: 'Abandoned Cart Conversion (ACC)',
    brand: 'Trendora',
    pod: 'Conversion Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '92.0%',
    description: 'Urgent flash sale cart checkout triggers.'
  },
  {
    name: 'Non-Delivery Report (NDR)',
    brand: 'Trendora',
    pod: 'Operations Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'Apparel delivery rerouting and COD verification.'
  },

  // --- SkinBloom (Single-Resource: EMP006) ---
  {
    name: 'Customer Support (CS)',
    brand: 'SkinBloom',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: '365-day operation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '99.0%',
    description: 'Botanical beauty consultations and order queries.'
  },
  {
    name: 'Retention',
    brand: 'SkinBloom',
    pod: 'Retention Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '93.0%',
    description: 'VIP beauty club renewals and anniversary rewards.'
  },

  // --- HomeCraft (Single-Resource: EMP007) ---
  {
    name: 'Customer Support (CS)',
    brand: 'HomeCraft',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '96.0%',
    description: 'Artisanal ceramics and fragile furniture logistics inquiries.'
  },
  {
    name: 'Abandoned Cart Conversion (ACC)',
    brand: 'HomeCraft',
    pod: 'Conversion Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '90.0%',
    description: 'Handcrafted furniture customized quote completion.'
  },
  {
    name: 'Non-Delivery Report (NDR)',
    brand: 'HomeCraft',
    pod: 'Operations Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '94.0%',
    description: 'White-glove fragile cargo delivery coordination.'
  },

  // --- NutriVibe (Single-Resource: EMP008) ---
  {
    name: 'Customer Support (CS)',
    brand: 'NutriVibe',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: '365-day operation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '99.0%',
    description: 'Nutritional wellness guidance and auto-refill queries.'
  },
  {
    name: 'Retention',
    brand: 'NutriVibe',
    pod: 'Retention Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '92.0%',
    description: 'Gummies & supplement recurring order retention.'
  },

  // --- StyleSphere (Single-Resource: EMP009) ---
  {
    name: 'Customer Support (CS)',
    brand: 'StyleSphere',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'Luxury eyewear and travel accessories warranty inquiries.'
  },
  {
    name: 'Abandoned Cart Conversion (ACC)',
    brand: 'StyleSphere',
    pod: 'Conversion Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '91.0%',
    description: 'Designer sunglasses checkout incentive recovery.'
  },

  // --- EcoEssentials (Single-Resource: EMP010) ---
  {
    name: 'Customer Support (CS)',
    brand: 'EcoEssentials',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: '365-day operation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '98.0%',
    description: 'Eco-friendly cleaning supplies queries and order routing.'
  },
  {
    name: 'Non-Delivery Report (NDR)',
    brand: 'EcoEssentials',
    pod: 'Operations Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'Zero-waste packaging delivery verification.'
  },

  // --- LuxeLiving (MULTI-RESOURCE BRAND 11: EMP011, EMP012, EMP013) ---
  {
    name: 'Customer Support (CS)',
    brand: 'LuxeLiving',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: '365-day operation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '99.8%',
    description: 'Concierge luxury interior customer support.'
  },
  {
    name: 'Abandoned Cart Conversion (ACC)',
    brand: 'LuxeLiving',
    pod: 'Conversion Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'High-ticket custom furniture cart recovery desk.'
  },
  {
    name: 'Non-Delivery Report (NDR)',
    brand: 'LuxeLiving',
    pod: 'Operations Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '98.0%',
    description: 'Special courier tracking for fragile luxury furnishings.'
  },

  // --- DailyDose (MULTI-RESOURCE BRAND 12: EMP014 & EMP015 on CS, EMP016 on Retention & NDR) ---
  {
    name: 'Customer Support (CS)',
    brand: 'DailyDose',
    pod: 'Customer Support Pod',
    status: 'Active',
    minimumStaff: 2, // ⭐️ Mandates 2 staff for high-volume coffee queue!
    operatingRule: '365-day operation',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: false,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '99.0%',
    description: 'High-volume coffee subscriber support queue.'
  },
  {
    name: 'Retention',
    brand: 'DailyDose',
    pod: 'Retention Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Sundays and public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '96.0%',
    description: 'Coffee beans auto-ship subscription renewal and churn prevention.'
  },
  {
    name: 'Non-Delivery Report (NDR)',
    brand: 'DailyDose',
    pod: 'Operations Pod',
    status: 'Active',
    minimumStaff: 1,
    operatingRule: 'Public holidays off',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    publicHolidaysOff: true,
    shiftTiming: 'Day (08:00 - 17:00)',
    slaTarget: '95.0%',
    description: 'Fresh roast beans expedited dispatch exceptions.'
  }
];

// =========================================================================
// 5. RESOURCE ALLOCATIONS (SINGLE-RESOURCE, MULTI-RESOURCE, SHARED & BACKUPS)
// =========================================================================
export const seedAssignmentsData = [
  // --- Single-Resource Brands (Brands 1 - 10: 1 primary dedicated employee handles all processes) ---
  // Brand 1: UrbanNest -> EMP001 handles CS, ACC, NDR
  { employeeId: 'EMP001', employeeName: 'Aarav Sharma', brand: 'UrbanNest', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP001', employeeName: 'Aarav Sharma', brand: 'UrbanNest', process: 'Abandoned Cart Conversion (ACC)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP001', employeeName: 'Aarav Sharma', brand: 'UrbanNest', process: 'Non-Delivery Report (NDR)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  // Multi-brand backup assignment: Aarav also backs up GlowTheory CS
  { employeeId: 'EMP001', employeeName: 'Aarav Sharma', brand: 'GlowTheory', process: 'Customer Support (CS)', assignmentType: 'Backup', pod: 'Customer Support Pod' },

  // Brand 2: GlowTheory -> EMP002 handles CS, ACC, NDR
  { employeeId: 'EMP002', employeeName: 'Rahul Sharma', brand: 'GlowTheory', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP002', employeeName: 'Rahul Sharma', brand: 'GlowTheory', process: 'Abandoned Cart Conversion (ACC)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP002', employeeName: 'Rahul Sharma', brand: 'GlowTheory', process: 'Non-Delivery Report (NDR)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  // Multi-brand backup assignment: Rahul backs up UrbanNest CS
  { employeeId: 'EMP002', employeeName: 'Rahul Sharma', brand: 'UrbanNest', process: 'Customer Support (CS)', assignmentType: 'Backup', pod: 'Customer Support Pod' },

  // Brand 3: FitFuel -> EMP003 handles CS, Retention, NDR
  { employeeId: 'EMP003', employeeName: 'Diya Mehta', brand: 'FitFuel', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP003', employeeName: 'Diya Mehta', brand: 'FitFuel', process: 'Retention', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP003', employeeName: 'Diya Mehta', brand: 'FitFuel', process: 'Non-Delivery Report (NDR)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  // Multi-brand backup assignment: Diya backs up PureHarvest CS
  { employeeId: 'EMP003', employeeName: 'Diya Mehta', brand: 'PureHarvest', process: 'Customer Support (CS)', assignmentType: 'Backup', pod: 'Customer Support Pod' },

  // Brand 4: PureHarvest -> EMP004 handles CS, ACC
  { employeeId: 'EMP004', employeeName: 'Kabir Joshi', brand: 'PureHarvest', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP004', employeeName: 'Kabir Joshi', brand: 'PureHarvest', process: 'Abandoned Cart Conversion (ACC)', assignmentType: 'Primary', pod: 'Customer Support Pod' },

  // Brand 5: Trendora -> EMP005 handles CS, ACC, NDR
  { employeeId: 'EMP005', employeeName: 'Ishita Sen', brand: 'Trendora', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP005', employeeName: 'Ishita Sen', brand: 'Trendora', process: 'Abandoned Cart Conversion (ACC)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP005', employeeName: 'Ishita Sen', brand: 'Trendora', process: 'Non-Delivery Report (NDR)', assignmentType: 'Primary', pod: 'Customer Support Pod' },

  // Brand 6: SkinBloom -> EMP006 handles CS, Retention
  { employeeId: 'EMP006', employeeName: 'Arjun Nair', brand: 'SkinBloom', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Customer Support Pod' },
  { employeeId: 'EMP006', employeeName: 'Arjun Nair', brand: 'SkinBloom', process: 'Retention', assignmentType: 'Primary', pod: 'Customer Support Pod' },

  // Brand 7: HomeCraft -> EMP007 handles CS, ACC, NDR
  { employeeId: 'EMP007', employeeName: 'Priya Patel', brand: 'HomeCraft', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Conversion Pod' },
  { employeeId: 'EMP007', employeeName: 'Priya Patel', brand: 'HomeCraft', process: 'Abandoned Cart Conversion (ACC)', assignmentType: 'Primary', pod: 'Conversion Pod' },
  { employeeId: 'EMP007', employeeName: 'Priya Patel', brand: 'HomeCraft', process: 'Non-Delivery Report (NDR)', assignmentType: 'Primary', pod: 'Conversion Pod' },
  // Multi-brand backup assignment: Priya backs up LuxeLiving ACC
  { employeeId: 'EMP007', employeeName: 'Priya Patel', brand: 'LuxeLiving', process: 'Abandoned Cart Conversion (ACC)', assignmentType: 'Backup', pod: 'Conversion Pod' },

  // Brand 8: NutriVibe -> EMP008 handles CS, Retention
  { employeeId: 'EMP008', employeeName: 'Rohan Verma', brand: 'NutriVibe', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Conversion Pod' },
  { employeeId: 'EMP008', employeeName: 'Rohan Verma', brand: 'NutriVibe', process: 'Retention', assignmentType: 'Primary', pod: 'Conversion Pod' },

  // Brand 9: StyleSphere -> EMP009 handles CS, ACC
  { employeeId: 'EMP009', employeeName: 'Ananya Rao', brand: 'StyleSphere', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Conversion Pod' },
  { employeeId: 'EMP009', employeeName: 'Ananya Rao', brand: 'StyleSphere', process: 'Abandoned Cart Conversion (ACC)', assignmentType: 'Primary', pod: 'Conversion Pod' },

  // Brand 10: EcoEssentials -> EMP010 handles CS, NDR
  { employeeId: 'EMP010', employeeName: 'Devansh Kapoor', brand: 'EcoEssentials', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Conversion Pod' },
  { employeeId: 'EMP010', employeeName: 'Devansh Kapoor', brand: 'EcoEssentials', process: 'Non-Delivery Report (NDR)', assignmentType: 'Primary', pod: 'Conversion Pod' },

  // --- Multi-Resource Brand 11: LuxeLiving ---
  // Employee A (EMP011) handles Customer Support
  { employeeId: 'EMP011', employeeName: 'Tanvi Kulkarni', brand: 'LuxeLiving', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Conversion Pod' },
  // Employee B (EMP012) handles ACC
  { employeeId: 'EMP012', employeeName: 'Siddharth Jain', brand: 'LuxeLiving', process: 'Abandoned Cart Conversion (ACC)', assignmentType: 'Primary', pod: 'Conversion Pod' },
  // Employee C (EMP013) handles NDR
  { employeeId: 'EMP013', employeeName: 'Rohan Gupta', brand: 'LuxeLiving', process: 'Non-Delivery Report (NDR)', assignmentType: 'Primary', pod: 'Retention Pod' },
  // Multi-brand backup assignment: Rohan also backs up DailyDose NDR
  { employeeId: 'EMP013', employeeName: 'Rohan Gupta', brand: 'DailyDose', process: 'Non-Delivery Report (NDR)', assignmentType: 'Backup', pod: 'Retention Pod' },

  // --- Multi-Resource Brand 12: DailyDose ---
  // Employee A & B BOTH handle Customer Support (⭐️ Shared Process with 2 Primary Employees!)
  { employeeId: 'EMP014', employeeName: 'Sneha Chatterjee', brand: 'DailyDose', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Retention Pod' },
  { employeeId: 'EMP015', employeeName: 'Aditya Singhania', brand: 'DailyDose', process: 'Customer Support (CS)', assignmentType: 'Primary', pod: 'Retention Pod' },
  // Employee C (EMP016) handles Retention and NDR
  { employeeId: 'EMP016', employeeName: 'Riya Saxena', brand: 'DailyDose', process: 'Retention', assignmentType: 'Primary', pod: 'Retention Pod' },
  { employeeId: 'EMP016', employeeName: 'Riya Saxena', brand: 'DailyDose', process: 'Non-Delivery Report (NDR)', assignmentType: 'Primary', pod: 'Retention Pod' },

  // Dedicated Backups from Operations & Escalation Pods
  { employeeId: 'EMP020', employeeName: 'Nikhil Choudhury', brand: 'UrbanNest', process: 'Non-Delivery Report (NDR)', assignmentType: 'Backup', pod: 'Operations Pod' },
  { employeeId: 'EMP022', employeeName: 'Karan Merchant', brand: 'Trendora', process: 'Non-Delivery Report (NDR)', assignmentType: 'Backup', pod: 'Operations Pod' },
  { employeeId: 'EMP026', employeeName: 'Simran Kaur', brand: 'UrbanNest', process: 'Customer Support (CS)', assignmentType: 'Backup', pod: 'Escalation Pod' },
  { employeeId: 'EMP027', employeeName: 'Harish Nambiar', brand: 'GlowTheory', process: 'Customer Support (CS)', assignmentType: 'Backup', pod: 'Escalation Pod' }
];

// =========================================================================
// 6. WEEKLY OFFS CONFIGURATION
// =========================================================================
export const seedWeeklyOffsData = seedEmployeesData.map((emp) => ({
  employeeId: emp.employeeId,
  employeeName: emp.name,
  brand: emp.brand,
  pod: emp.pod,
  weeklyOffRule: emp.weeklyOffDays.join(', '),
  scheduledOffDays: emp.weeklyOffDays,
  upcomingOffDate: '2026-11-22',
  shiftPattern: 'Individual Schedule Pattern',
  notes: `Primary designated off on ${emp.weeklyOffDays.join(' & ')}.`
}));

// =========================================================================
// 7. PUBLIC HOLIDAYS (NOVEMBER 2026)
// =========================================================================
export const seedHolidaysData = [
  {
    name: 'Diwali / Deepavali',
    date: '2026-11-10',
    dayOfWeek: 'Tue',
    applicableRegionOrGroup: 'National All Regions',
    type: 'Gazetted',
    affectedPods: ['All Pods'],
    isFloating: false,
    description: 'National festival of lights. Non-365 day operations observe full holiday closure.'
  },
  {
    name: 'Govardhan Puja',
    date: '2026-11-12',
    dayOfWeek: 'Thu',
    applicableRegionOrGroup: 'North & Western Regions',
    type: 'Regional',
    affectedPods: ['Conversion Pod', 'Operations Pod'],
    isFloating: false,
    description: 'Regional festive observance. Brand-specific holiday policy enforced.'
  },
  {
    name: 'Guru Nanak Jayanti',
    date: '2026-11-24',
    dayOfWeek: 'Tue',
    applicableRegionOrGroup: 'National All Regions',
    type: 'Gazetted',
    affectedPods: ['All Pods'],
    isFloating: false,
    description: 'Prakash Utsav national holiday. 365-day brands maintain essential minimum staffing.'
  },
  {
    name: 'Guru Tegh Bahadur Martyrdom Day',
    date: '2026-11-28',
    dayOfWeek: 'Sat',
    applicableRegionOrGroup: 'Northern Region',
    type: 'Regional',
    affectedPods: ['Customer Support Pod', 'Retention Pod'],
    isFloating: true,
    description: 'Regional observance honoring civic sacrifice.'
  }
];

// =========================================================================
// 8. SAMPLE LEAVE APPLICATIONS (PLANNED, APPROVED & COMP-OFF)
// =========================================================================
export const seedLeavesData = [
  // Leave 1: Ishita Sen (EMP005) - Triggers Coverage Gap Conflict on Single-Resource Brand Trendora!
  {
    employeeId: 'EMP005',
    employeeName: 'Ishita Sen',
    role: 'Senior Support Executive',
    brand: 'Trendora',
    pod: 'Customer Support Pod',
    availabilityStatus: 'Approved leave',
    leaveType: 'Planned Leave',
    startDate: '2026-11-20',
    endDate: '2026-11-21',
    dates: ['2026-11-20', '2026-11-21'],
    durationDays: 2,
    status: 'Approved',
    reason: 'Family wedding commitment in Kolkata.',
    reviewedBy: 'Aarav Sharma',
    reviewerComments: 'Approved by Support Lead. Cross-coverage backup required.'
  },
  // Leave 2: Sneha Chatterjee (EMP014) - Triggers Insufficient Staffing on DailyDose CS!
  {
    employeeId: 'EMP014',
    employeeName: 'Sneha Chatterjee',
    role: 'Loyalty & Retention Specialist',
    brand: 'DailyDose',
    pod: 'Retention Pod',
    availabilityStatus: 'Approved leave',
    leaveType: 'Planned Leave',
    startDate: '2026-11-21',
    endDate: '2026-11-21',
    dates: ['2026-11-21'],
    durationDays: 1,
    status: 'Approved',
    reason: 'Personal medical appointment.',
    reviewedBy: 'Rohan Gupta',
    reviewerComments: 'Approved. DailyDose will run on single staff for 1 day.'
  },
  // Leave 3: Rahul Sharma (EMP002) - GlowTheory
  {
    employeeId: 'EMP002',
    employeeName: 'Rahul Sharma',
    role: 'Support Executive',
    brand: 'GlowTheory',
    pod: 'Customer Support Pod',
    availabilityStatus: 'Approved leave',
    leaveType: 'Casual Leave',
    startDate: '2026-11-16',
    endDate: '2026-11-16',
    dates: ['2026-11-16'],
    durationDays: 1,
    status: 'Approved',
    reason: 'Personal errand and documentation.',
    reviewedBy: 'Aarav Sharma',
    reviewerComments: 'Covered by Aarav Sharma as backup.'
  },
  // Leave 4: Rohan Verma (EMP008) - Comp-off
  {
    employeeId: 'EMP008',
    employeeName: 'Rohan Verma',
    role: 'Cart Recovery Specialist',
    brand: 'NutriVibe',
    pod: 'Conversion Pod',
    availabilityStatus: 'Comp-off',
    leaveType: 'Comp-off',
    startDate: '2026-11-05',
    endDate: '2026-11-05',
    dates: ['2026-11-05'],
    durationDays: 1,
    status: 'Approved',
    reason: 'Compensatory off for Diwali festival prep weekend shift.',
    reviewedBy: 'Priya Patel',
    reviewerComments: 'Comp-off authorized for extra hours worked.'
  },
  // Leave 5: Karan Merchant (EMP022) - Pending Review
  {
    employeeId: 'EMP022',
    employeeName: 'Karan Merchant',
    role: 'NDR Specialist',
    brand: 'Trendora',
    pod: 'Operations Pod',
    availabilityStatus: 'Planned leave',
    leaveType: 'Planned Leave',
    startDate: '2026-11-26',
    endDate: '2026-11-27',
    dates: ['2026-11-26', '2026-11-27'],
    durationDays: 2,
    status: 'Pending',
    reason: 'Annual family festival gathering.',
    reviewedBy: null,
    reviewerComments: ''
  }
];

// =========================================================================
// 9. SAMPLE SCHEDULING CONFLICTS (5 SCENARIOS: HARD VS SOFT CONSTRAINTS)
// =========================================================================
export const seedConflictsData = [
  // Conflict 1: Coverage Gap (Hard Constraint)
  {
    title: 'Coverage Gap: Single-Resource Employee Unavailable',
    description: 'Sole dedicated resource on Trendora is on approved leave without active backup coverage.',
    date: '2026-11-20',
    dateFormatted: 'Nov 20',
    brand: 'Trendora',
    process: 'Non-Delivery Report (NDR)',
    problem: 'No employee available for mandatory brand queue',
    severity: 'Critical',
    category: 'Critical coverage gap',
    employeeName: 'Ishita Sen',
    employeeId: 'EMP005',
    pod: 'Customer Support Pod',
    shift: 'Day (08:00 - 17:00)',
    requiredEmployees: 1,
    availableEmployees: 0,
    reason: 'Sole dedicated employee Ishita Sen (EMP005) is on approved leave Nov 20-21. No backup is currently scheduled.',
    possibleResolution: 'Activate secondary cross-trained resource (e.g. Karan Merchant EMP022) or reassign from Operations Pod.',
    status: 'Unresolved',
    conflictType: 'Coverage Gap'
  },
  // Conflict 2: Insufficient Staffing (Hard Constraint)
  {
    title: 'Insufficient Staffing: Multi-Resource Queue Deficit',
    description: 'DailyDose Customer Support mandates minimum 2 agents, but only 1 is rostered on duty.',
    date: '2026-11-21',
    dateFormatted: 'Nov 21',
    brand: 'DailyDose',
    process: 'Customer Support (CS)',
    problem: 'Insufficient staff below operational minimum threshold',
    severity: 'Critical',
    category: 'Critical coverage gap',
    employeeName: 'Sneha Chatterjee',
    employeeId: 'EMP014',
    pod: 'Retention Pod',
    shift: 'Day (08:00 - 17:00)',
    requiredEmployees: 2,
    availableEmployees: 1,
    reason: 'DailyDose mandates minimum 2 CS staff. Sneha Chatterjee is on approved leave, leaving only Aditya Singhania on duty.',
    possibleResolution: 'Call in backup resource or allocate cross-pod specialist Kunal Roy (EMP029) to cover peak queue hours.',
    status: 'Unresolved',
    conflictType: 'Understaffed'
  },
  // Conflict 3: Weekly-Off Preference Violation (Soft Constraint)
  {
    title: 'Weekly-Off Preference Violation',
    description: 'Employee rostered on designated preferred weekly-off day due to scheduling constraint.',
    date: '2026-11-18',
    dateFormatted: 'Nov 18',
    brand: 'FitFuel',
    process: 'Customer Support (CS)',
    problem: 'Preferred weekly off violated by roster schedule',
    severity: 'Warning',
    category: 'Soft warning',
    employeeName: 'Diya Mehta',
    employeeId: 'EMP003',
    pod: 'Customer Support Pod',
    shift: 'Day (08:00 - 17:00)',
    requiredEmployees: 1,
    availableEmployees: 1,
    reason: 'Diya Mehta has Wednesday designated as weekly off, but is rostered due to high mid-week ticket volume.',
    possibleResolution: 'Grant compensatory off on Friday or swap shift with secondary resource.',
    status: 'Unresolved',
    conflictType: 'Preference Violation'
  },
  // Conflict 4: Double Booking Scenario (Hard Constraint Test)
  {
    title: 'Double Booking: Overlapping Shift Allocation',
    description: 'Employee allocated to concurrent shifts on two distinct brand queues simultaneously.',
    date: '2026-11-22',
    dateFormatted: 'Nov 22',
    brand: 'LuxeLiving',
    process: 'Abandoned Cart Conversion (ACC)',
    problem: 'Overlapping simultaneous shift allocations detected',
    severity: 'Critical',
    category: 'Double booking',
    employeeName: 'Siddharth Jain',
    employeeId: 'EMP012',
    pod: 'Conversion Pod',
    shift: 'Day (08:00 - 17:00)',
    requiredEmployees: 1,
    availableEmployees: 2,
    reason: 'Siddharth Jain was concurrently assigned to LuxeLiving ACC and PureHarvest ACC during manual adjustment.',
    possibleResolution: 'Cancel overlapping secondary allocation or reassign PureHarvest to backup agent.',
    status: 'Unresolved',
    conflictType: 'Double Booking'
  },
  // Conflict 5: Multi-Brand Impact (Hard Constraint)
  {
    title: 'Multi-Brand Impact: Shared Resource Absence Cascading',
    description: 'Absence of cross-allocated agent causes cascading coverage shortfalls across multiple client brands.',
    date: '2026-11-25',
    dateFormatted: 'Nov 25',
    brand: 'FitFuel',
    process: 'Customer Support (CS)',
    problem: 'Multi-brand primary and backup coverage breached simultaneously',
    severity: 'High',
    category: 'Critical coverage gap',
    employeeName: 'Diya Mehta',
    employeeId: 'EMP003',
    pod: 'Customer Support Pod',
    shift: 'Day (08:00 - 17:00)',
    requiredEmployees: 2,
    availableEmployees: 1,
    reason: 'Diya Mehta handles FitFuel primary queue and also stands as primary backup for PureHarvest. Her unavailability impacts both brands.',
    possibleResolution: 'Engage Escalation Pod specialist Harish Nambiar (EMP027) as temporary cross-brand standby.',
    status: 'Unresolved',
    conflictType: 'Multi-Brand Impact'
  }
];

// =========================================================================
// 10. GENERATE DETERMINISTIC SAMPLE ROSTER ENTRIES FOR NOVEMBER 2026
// =========================================================================
export const generateNovemberRosterEntries = () => {
  const entries = [];
  const daysInNov = 30;
  const holidaysMap = {
    '2026-11-10': 'Diwali / Deepavali',
    '2026-11-12': 'Govardhan Puja',
    '2026-11-24': 'Guru Nanak Jayanti',
    '2026-11-28': 'Guru Tegh Bahadur Martyrdom Day'
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map each assignment for November 2026
  for (let day = 1; day <= daysInNov; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-11-${dayStr}`;
    const dateObj = new Date(2026, 10, day); // month 10 = Nov
    const dayOfWeek = dayNames[dateObj.getDay()];

    seedAssignmentsData.forEach((asgn) => {
      const emp = seedEmployeesData.find((e) => e.employeeId === asgn.employeeId);
      if (!emp) return;

      // Find process rule
      const proc = seedProcessesData.find(
        (p) => p.brand === asgn.brand && p.name === asgn.process
      );

      let status = 'Working';
      let leaveType = null;
      let holidayName = null;
      let conflictReason = null;

      // 1. Check if employee has designated weekly off on this day
      const isWeeklyOff =
        (emp.weeklyOffDays.includes('Sunday') && dayOfWeek === 'Sun') ||
        (emp.weeklyOffDays.includes('Wednesday') && dayOfWeek === 'Wed') ||
        (emp.weeklyOffDays.includes('Friday') && dayOfWeek === 'Fri') ||
        (emp.weeklyOffDays.includes('Saturday') && dayOfWeek === 'Sat');

      if (isWeeklyOff) {
        status = 'Weekly Off';
      }

      // 2. Check if Public Holiday applies
      if (holidaysMap[dateStr]) {
        // If process is NOT a 365-day operation and has public holidays off
        if (proc && proc.publicHolidaysOff) {
          status = 'Holiday';
          holidayName = holidaysMap[dateStr];
        }
      }

      // 3. Check if on Approved Leave
      const approvedLeave = seedLeavesData.find(
        (l) => l.employeeId === emp.employeeId && l.dates.includes(dateStr) && l.status === 'Approved'
      );
      if (approvedLeave) {
        status = 'Leave';
        leaveType = approvedLeave.leaveType;
      }

      // 4. Mark known intentional conflict date for demonstration
      if (asgn.brand === 'Trendora' && dateStr === '2026-11-20' && asgn.employeeId === 'EMP005') {
        status = 'Conflict';
        conflictReason = 'Critical coverage gap: Single-resource employee on approved leave';
      } else if (asgn.brand === 'DailyDose' && dateStr === '2026-11-21' && asgn.employeeId === 'EMP014') {
        status = 'Conflict';
        conflictReason = 'Insufficient staff: Minimum staffing requirement breached';
      }

      entries.push({
        month: 'November 2026',
        monthIndex: 10,
        year: 2026,
        date: dateStr,
        dayOfMonth: day,
        dayOfWeek,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        brand: asgn.brand,
        pod: asgn.pod || emp.pod,
        process: asgn.process,
        status,
        shift: 'Day (08:00 - 17:00)',
        leaveType,
        holidayName,
        conflictReason,
        notes: `Rostered allocation for ${asgn.brand} - ${asgn.process}`
      });
    });
  }

  return entries;
};

// =========================================================================
// 11. MAIN DATABASE SEED FUNCTION
// =========================================================================
export const seedCompleteDatabase = async () => {
  console.log('\n======================================================');
  console.log('🚀 INITIALIZING SMART ROSTER DATABASE SEED ENGINE');
  console.log('======================================================\n');

  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      console.warn('[Seed Warning] MongoDB connection unavailable or in resilience mode.');
      console.warn('[Seed Info] Seed records are fully prepared and synchronized for active in-memory resilience mode.');
      return { success: true, inMemory: true };
    }

    console.log('[Seed] Connected to MongoDB Atlas. Executing controlled seed replacement...');

    // 1. Seed Pods (Safe Upsert)
    for (const pod of seedPodsData) {
      await Pod.findOneAndUpdate({ name: pod.name }, pod, { upsert: true, new: true });
    }
    console.log(`✓ Seeded ${seedPodsData.length} Operational Pods.`);

    // 2. Seed Employees (Safe Upsert)
    for (const emp of seedEmployeesData) {
      await Employee.findOneAndUpdate({ employeeId: emp.employeeId }, emp, { upsert: true, new: true });
    }
    console.log(`✓ Seeded ${seedEmployeesData.length} Employee Profiles.`);

    // 3. Link Pod Leads
    for (const pod of seedPodsData) {
      const leadEmp = await Employee.findOne({ employeeId: pod.leadId });
      if (leadEmp) {
        await Pod.findOneAndUpdate(
          { name: pod.name },
          { lead: leadEmp.name, leadId: leadEmp.employeeId }
        );
      }
    }
    console.log(`✓ Linked 5 designated Pod Leads to actual Employee records.`);

    // 4. Seed Brands (Safe Upsert)
    for (const brand of seedBrandsData) {
      await Brand.findOneAndUpdate({ name: brand.name }, brand, { upsert: true, new: true });
    }
    console.log(`✓ Seeded ${seedBrandsData.length} Fictional D2C Brands.`);

    // 5. Seed Processes (Controlled replacement by brand + name)
    await Process.deleteMany({});
    await Process.insertMany(seedProcessesData);
    console.log(`✓ Seeded ${seedProcessesData.length} Brand Process Configurations.`);

    // 6. Seed Resource Assignments
    await ResourceAssignment.deleteMany({});
    await ResourceAssignment.insertMany(seedAssignmentsData);
    console.log(`✓ Seeded ${seedAssignmentsData.length} Employee-Brand-Process Assignments.`);

    // 7. Seed Weekly Offs
    await WeeklyOff.deleteMany({});
    await WeeklyOff.insertMany(seedWeeklyOffsData);
    console.log(`✓ Seeded ${seedWeeklyOffsData.length} Weekly Off Preferences.`);

    // 8. Seed Public Holidays
    await Holiday.deleteMany({});
    await Holiday.insertMany(seedHolidaysData);
    console.log(`✓ Seeded ${seedHolidaysData.length} Public Holidays.`);

    // 9. Seed Leaves
    await Leave.deleteMany({});
    await Leave.insertMany(seedLeavesData);
    console.log(`✓ Seeded ${seedLeavesData.length} Leave Records.`);

    // 10. Seed Conflicts
    await Conflict.deleteMany({});
    await Conflict.insertMany(seedConflictsData);
    console.log(`✓ Seeded ${seedConflictsData.length} Scheduling Conflicts.`);

    // 11. Seed November 2026 Roster
    const rosterEntries = generateNovemberRosterEntries();
    await RosterAssignment.deleteMany({ month: 'November 2026' });
    await RosterAssignment.insertMany(rosterEntries);

    // Summary Roster Document
    await Roster.findOneAndUpdate(
      { month: 'November 2026', year: 2026 },
      {
        month: 'November 2026',
        monthIndex: 10,
        year: 2026,
        totalRequiredShifts: rosterEntries.length,
        assignedShifts: rosterEntries.filter((r) => r.status === 'Working').length,
        completionRate: 94.8,
        status: 'Published',
        lastGeneratedAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`✓ Seeded ${rosterEntries.length} November 2026 Monthly Roster Entries.`);

    // 12. Ensure Demo Auth Accounts exist for all 4 roles + pod leads with their exact respective passwords
    const demoUsers = [
      { name: 'System Administrator', email: 'admin@datastraw.io', role: 'admin', rawPassword: 'Admin@12345', isActive: true },
      { name: 'Central Operations Manager', email: 'ops.manager@datastraw.io', role: 'operations_manager', rawPassword: 'Ops@12345', isActive: true },
      { name: 'Aarav Sharma (Pod Lead)', email: 'pod.lead@datastraw.io', role: 'pod_lead', rawPassword: 'Lead@12345', podId: 'Customer Support Pod', employeeId: 'EMP001', isActive: true },
      { name: 'Rahul Sharma (Employee)', email: 'employee@datastraw.io', role: 'employee', rawPassword: 'Emp@12345', employeeId: 'EMP002', podId: 'Customer Support Pod', isActive: true }
    ];

    for (const u of demoUsers) {
      const passwordHash = await bcrypt.hash(u.rawPassword, 10);
      const userDoc = { ...u, passwordHash };
      delete userDoc.rawPassword;
      await User.findOneAndUpdate(
        { email: u.email },
        userDoc,
        { upsert: true, new: true }
      );
    }
    console.log(`✓ Synchronized authentication user profiles for testing.`);

    // Display formatted final output summary
    console.log('\n======================================================');
    console.log('Sample data successfully created.');
    console.log('');
    console.log(`Employees: ${seedEmployeesData.length}`);
    console.log(`Pods: ${seedPodsData.length}`);
    console.log(`Pod Leads: 5`);
    console.log(`Brands: ${seedBrandsData.length}`);
    console.log(`Processes: 4`);
    console.log(`Assignments: ${seedAssignmentsData.length}`);
    console.log(`Leaves: ${seedLeavesData.length}`);
    console.log(`Holidays: ${seedHolidaysData.length}`);
    console.log(`Roster Entries: ${rosterEntries.length}`);
    console.log(`Conflicts: ${seedConflictsData.length}`);
    console.log('======================================================\n');

    return {
      success: true,
      employees: seedEmployeesData.length,
      pods: seedPodsData.length,
      podLeads: 5,
      brands: seedBrandsData.length,
      processes: 4,
      assignments: seedAssignmentsData.length,
      leaves: seedLeavesData.length,
      holidays: seedHolidaysData.length,
      rosterEntries: rosterEntries.length,
      conflicts: seedConflictsData.length
    };
  } catch (error) {
    console.error('Seed execution error:', error);
    throw error;
  }
};

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  seedCompleteDatabase()
    .then(() => {
      console.log('Seed script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed script encountered a fatal error:', err);
      process.exit(1);
    });
}
