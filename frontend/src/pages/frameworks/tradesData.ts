import type { Trade } from './types';
import { PLUMBING_TRADE } from './plumbingData';

export const TRADES: Trade[] = [
    PLUMBING_TRADE,
    {
        id: 'motor-mechanics',
        name: 'Motor Mechanics',
        description: 'Internal combustion engines, EV drivetrains, transmission systems, and electronic diagnostics.',
        icon: '⚙️',
        moduleCount: 18,
        gradientFrom: '#3d2b00',
        gradientTo: '#a06000',
        subjects: [
            {
                id: 'mm-theory', name: 'Trade Theory',
                topics: [
                    { id: 'mm-1', name: 'Basics of Metal Shaping', type: 'THEORY', hours: 4 },
                    { id: 'mm-2', name: 'Workplace Safety & Protocol', type: 'SAFETY', hours: 2 },
                    { id: 'mm-3', name: 'Introduction to Measurement Tools', type: 'PRACTICAL', hours: 6 },
                    { id: 'mm-4', name: 'Hand Tools and Equipment Handling', type: 'THEORY', hours: 4 },
                    { id: 'mm-5', name: 'Advanced Micrometer Reading', type: 'PRACTICAL', hours: 3 },
                    { id: 'mm-6', name: 'Precision Drilling Techniques', type: 'THEORY', hours: 5 },
                    { id: 'mm-7', name: 'Ferrous and Non-Ferrous Metals', type: 'THEORY', hours: 4 },
                    { id: 'mm-8', name: 'Engine Overhaul Fundamentals', type: 'PRACTICAL', hours: 8 },
                ],
            },
            {
                id: 'mm-math', name: 'Mathematics',
                topics: [
                    { id: 'mm-m1', name: 'Torque and Force Calculations', type: 'THEORY', hours: 3 },
                    { id: 'mm-m2', name: 'Fuel Efficiency Metrics', type: 'THEORY', hours: 2 },
                    { id: 'mm-m3', name: 'Engine Displacement Formulae', type: 'THEORY', hours: 3 },
                    { id: 'mm-m4', name: 'Electrical Circuit Calculations', type: 'THEORY', hours: 4 },
                ],
            },
            {
                id: 'mm-eng-sci', name: 'Engineering Science',
                topics: [
                    { id: 'mm-es1', name: 'Thermodynamics Basics', type: 'THEORY', hours: 5 },
                    { id: 'mm-es2', name: 'Fluid Mechanics in Engines', type: 'THEORY', hours: 4 },
                    { id: 'mm-es3', name: 'Electrical Systems in Vehicles', type: 'PRACTICAL', hours: 6 },
                    { id: 'mm-es4', name: 'EV Battery Technology', type: 'THEORY', hours: 4 },
                ],
            },
            {
                id: 'mm-drawing', name: 'Engineering Drawing',
                topics: [
                    { id: 'mm-d1', name: 'Engine Assembly Diagrams', type: 'THEORY', hours: 3 },
                    { id: 'mm-d2', name: 'Wiring Diagram Interpretation', type: 'PRACTICAL', hours: 4 },
                    { id: 'mm-d3', name: 'CAD Introduction', type: 'PRACTICAL', hours: 5 },
                ],
            },
        ],
    },
    {
        id: 'welding',
        name: 'Welding',
        description: 'Advanced metallurgy, MIG/TIG techniques, structural integrity, and industrial fabrication.',
        icon: '🔥',
        moduleCount: 15,
        gradientFrom: '#2d0a00',
        gradientTo: '#7a2500',
        subjects: [
            {
                id: 'weld-theory', name: 'Trade Theory',
                topics: [
                    { id: 'wt-1', name: 'Welding Safety and PPE', type: 'SAFETY', hours: 3 },
                    { id: 'wt-2', name: 'Types of Welding Processes', type: 'THEORY', hours: 4 },
                    { id: 'wt-3', name: 'MIG Welding Fundamentals', type: 'PRACTICAL', hours: 6 },
                    { id: 'wt-4', name: 'TIG Welding Techniques', type: 'PRACTICAL', hours: 8 },
                    { id: 'wt-5', name: 'Arc Welding Basics', type: 'PRACTICAL', hours: 5 },
                    { id: 'wt-6', name: 'Weld Quality Inspection', type: 'THEORY', hours: 3 },
                ],
            },
            {
                id: 'weld-metallurgy', name: 'Metallurgy',
                topics: [
                    { id: 'wm-1', name: 'Properties of Metals', type: 'THEORY', hours: 4 },
                    { id: 'wm-2', name: 'Heat Treatment Processes', type: 'THEORY', hours: 3 },
                    { id: 'wm-3', name: 'Alloy Identification', type: 'PRACTICAL', hours: 3 },
                ],
            },
            {
                id: 'weld-drawing', name: 'Engineering Drawing',
                topics: [
                    { id: 'wd-1', name: 'Welding Symbol Interpretation', type: 'THEORY', hours: 4 },
                    { id: 'wd-2', name: 'Structural Drawing Reading', type: 'THEORY', hours: 3 },
                    { id: 'wd-3', name: 'Joint Design Drawings', type: 'PRACTICAL', hours: 4 },
                ],
            },
        ],
    },
    {
        id: 'electrician',
        name: 'Electrician (ITI)',
        description: 'Electrical wiring, installation of electrical equipment, troubleshooting, and safety standards.',
        icon: '⚡',
        moduleCount: 20,
        gradientFrom: '#1a3300',
        gradientTo: '#3d7a00',
        subjects: [
            {
                id: 'elec-theory', name: 'Trade Theory',
                topics: [
                    { id: 'et-1', name: 'Fundamentals of Electricity', type: 'THEORY', hours: 5 },
                    { id: 'et-2', name: 'Electrical Safety Standards', type: 'SAFETY', hours: 3 },
                    { id: 'et-3', name: 'DC Circuits', type: 'THEORY', hours: 6 },
                    { id: 'et-4', name: 'AC Circuits', type: 'THEORY', hours: 6 },
                    { id: 'et-5', name: 'Transformers', type: 'THEORY', hours: 4 },
                    { id: 'et-6', name: 'Wiring and Conduit Installation', type: 'PRACTICAL', hours: 8 },
                ],
            },
            {
                id: 'elec-workshop', name: 'Workshop Science',
                topics: [
                    { id: 'ew-1', name: 'Soldering Techniques', type: 'PRACTICAL', hours: 4 },
                    { id: 'ew-2', name: 'PCB Assembly', type: 'PRACTICAL', hours: 3 },
                    { id: 'ew-3', name: 'Motor Winding Basics', type: 'PRACTICAL', hours: 5 },
                    { id: 'ew-4', name: 'Panel Board Installation', type: 'PRACTICAL', hours: 6 },
                ],
            },
            {
                id: 'elec-math', name: 'Mathematics',
                topics: [
                    { id: 'em-1', name: "Ohm's Law Applications", type: 'THEORY', hours: 3 },
                    { id: 'em-2', name: 'Power Factor Calculations', type: 'THEORY', hours: 3 },
                    { id: 'em-3', name: 'Load Estimation', type: 'THEORY', hours: 4 },
                ],
            },
            {
                id: 'elec-drawing', name: 'Engineering Drawing',
                topics: [
                    { id: 'ed-1', name: 'Electrical Schematic Reading', type: 'THEORY', hours: 4 },
                    { id: 'ed-2', name: 'Circuit Diagram Drafting', type: 'PRACTICAL', hours: 4 },
                    { id: 'ed-3', name: 'Single Line Diagrams', type: 'THEORY', hours: 3 },
                ],
            },
        ],
    },
    {
        id: 'carpentry',
        name: 'Carpentry',
        description: 'Woodworking, furniture construction, structural framing, and finishing techniques for industry.',
        icon: '🪚',
        moduleCount: 14,
        gradientFrom: '#2d1a00',
        gradientTo: '#7a4a00',
        subjects: [
            {
                id: 'carp-theory', name: 'Trade Theory',
                topics: [
                    { id: 'ct-1', name: 'Wood Types and Properties', type: 'THEORY', hours: 4 },
                    { id: 'ct-2', name: 'Hand Tool Operation', type: 'PRACTICAL', hours: 5 },
                    { id: 'ct-3', name: 'Power Tool Safety', type: 'SAFETY', hours: 3 },
                    { id: 'ct-4', name: 'Joinery Techniques', type: 'PRACTICAL', hours: 6 },
                    { id: 'ct-5', name: 'Wood Finishing and Polishing', type: 'PRACTICAL', hours: 4 },
                ],
            },
            {
                id: 'carp-drawing', name: 'Engineering Drawing',
                topics: [
                    { id: 'cd-1', name: 'Furniture Plan Reading', type: 'THEORY', hours: 3 },
                    { id: 'cd-2', name: 'Structural Framing Drawings', type: 'THEORY', hours: 4 },
                    { id: 'cd-3', name: 'Isometric Views', type: 'PRACTICAL', hours: 3 },
                ],
            },
        ],
    },
    {
        id: 'healthcare-assistant',
        name: 'Healthcare Assistant',
        description: 'Patient care fundamentals, clinical support, basic nursing procedures, and medical ethics.',
        icon: '🏥',
        moduleCount: 16,
        gradientFrom: '#002d3d',
        gradientTo: '#006680',
        subjects: [
            {
                id: 'hca-theory', name: 'Clinical Theory',
                topics: [
                    { id: 'ht-1', name: 'Anatomy and Physiology Basics', type: 'THEORY', hours: 6 },
                    { id: 'ht-2', name: 'Patient Hygiene and Care', type: 'PRACTICAL', hours: 4 },
                    { id: 'ht-3', name: 'Infection Control', type: 'SAFETY', hours: 3 },
                    { id: 'ht-4', name: 'Vital Signs Monitoring', type: 'PRACTICAL', hours: 4 },
                    { id: 'ht-5', name: 'First Aid Fundamentals', type: 'PRACTICAL', hours: 5 },
                ],
            },
            {
                id: 'hca-communication', name: 'Communication Skills',
                topics: [
                    { id: 'hc-1', name: 'Patient Communication', type: 'THEORY', hours: 3 },
                    { id: 'hc-2', name: 'Medical Documentation', type: 'PRACTICAL', hours: 4 },
                    { id: 'hc-3', name: 'Healthcare Ethics', type: 'THEORY', hours: 3 },
                ],
            },
        ],
    },
];
