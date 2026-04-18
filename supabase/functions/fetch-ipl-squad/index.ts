import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PlayerData {
  name: string;
  role: string;
  image_url: string;
  credits: number;
}

// IPL 2025 squads with real player data
const IPL_SQUADS: Record<string, PlayerData[]> = {
  CSK: [
    { name: "MS Dhoni", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/1.png", credits: 9.0 },
    { name: "Ruturaj Gaikwad", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3722.png", credits: 9.5 },
    { name: "Devon Conway", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3838.png", credits: 8.5 },
    { name: "Shivam Dube", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3453.png", credits: 8.5 },
    { name: "Ravindra Jadeja", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/132.png", credits: 9.5 },
    { name: "Moeen Ali", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/2733.png", credits: 8.5 },
    { name: "Deepak Chahar", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/594.png", credits: 8.0 },
    { name: "Tushar Deshpande", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3805.png", credits: 7.5 },
    { name: "Matheesha Pathirana", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4898.png", credits: 8.5 },
    { name: "Maheesh Theekshana", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4468.png", credits: 8.0 },
    { name: "Rachin Ravindra", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/4466.png", credits: 8.5 },
    { name: "Sameer Rizvi", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/5138.png", credits: 7.0 },
    { name: "Avanish Rao Aravelly", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/5144.png", credits: 6.5 },
    { name: "Shardul Thakur", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/548.png", credits: 8.0 },
    { name: "Mukesh Choudhary", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4496.png", credits: 7.0 },
  ],
  MI: [
    { name: "Rohit Sharma", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/107.png", credits: 10.0 },
    { name: "Ishan Kishan", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/2740.png", credits: 9.0 },
    { name: "Suryakumar Yadav", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/446.png", credits: 9.5 },
    { name: "Tilak Varma", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4497.png", credits: 8.5 },
    { name: "Hardik Pandya", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/2735.png", credits: 10.0 },
    { name: "Tim David", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4507.png", credits: 8.0 },
    { name: "Jasprit Bumrah", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/2738.png", credits: 10.0 },
    { name: "Piyush Chawla", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/57.png", credits: 7.5 },
    { name: "Gerald Coetzee", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/5003.png", credits: 8.0 },
    { name: "Romario Shepherd", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/4469.png", credits: 7.5 },
    { name: "Akash Madhwal", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4889.png", credits: 7.5 },
    { name: "Nehal Wadhera", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4890.png", credits: 7.0 },
    { name: "Naman Dhir", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/5140.png", credits: 7.0 },
    { name: "Nuwan Thushara", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/5004.png", credits: 7.5 },
    { name: "Dewald Brevis", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4703.png", credits: 7.5 },
  ],
  RCB: [
    { name: "Virat Kohli", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/164.png", credits: 10.5 },
    { name: "Faf du Plessis", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/145.png", credits: 9.0 },
    { name: "Glenn Maxwell", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/325.png", credits: 9.0 },
    { name: "Rajat Patidar", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4465.png", credits: 8.5 },
    { name: "Dinesh Karthik", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/38.png", credits: 8.0 },
    { name: "Cameron Green", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3837.png", credits: 8.5 },
    { name: "Mohammed Siraj", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/2760.png", credits: 8.5 },
    { name: "Yash Dayal", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4485.png", credits: 7.5 },
    { name: "Wanindu Hasaranga", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3462.png", credits: 8.5 },
    { name: "Karn Sharma", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/424.png", credits: 7.0 },
    { name: "Reece Topley", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/2766.png", credits: 7.5 },
    { name: "Suyash Prabhudessai", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4488.png", credits: 7.0 },
    { name: "Anuj Rawat", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/4464.png", credits: 7.0 },
    { name: "Mahipal Lomror", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3459.png", credits: 7.0 },
    { name: "Lockie Ferguson", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/2765.png", credits: 8.0 },
  ],
  KKR: [
    { name: "Shreyas Iyer", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/424.png", credits: 9.5 },
    { name: "Nitish Rana", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/2755.png", credits: 8.0 },
    { name: "Venkatesh Iyer", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/4461.png", credits: 8.5 },
    { name: "Andre Russell", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/276.png", credits: 9.5 },
    { name: "Sunil Narine", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/230.png", credits: 9.5 },
    { name: "Rinku Singh", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3455.png", credits: 8.5 },
    { name: "Phil Salt", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/3836.png", credits: 9.0 },
    { name: "Mitchell Starc", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/269.png", credits: 9.5 },
    { name: "Varun Chakravarthy", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3461.png", credits: 8.5 },
    { name: "Harshit Rana", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4893.png", credits: 8.0 },
    { name: "Ramandeep Singh", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/4460.png", credits: 7.0 },
    { name: "Angkrish Raghuvanshi", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/5006.png", credits: 6.5 },
    { name: "Manish Pandey", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/170.png", credits: 7.5 },
    { name: "Anukul Roy", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3456.png", credits: 7.0 },
    { name: "Suyash Sharma", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/5007.png", credits: 7.0 },
  ],
  RR: [
    { name: "Sanju Samson", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/425.png", credits: 9.5 },
    { name: "Yashasvi Jaiswal", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3806.png", credits: 9.5 },
    { name: "Jos Buttler", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/308.png", credits: 9.5 },
    { name: "Shimron Hetmyer", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3451.png", credits: 8.0 },
    { name: "Riyan Parag", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3457.png", credits: 8.0 },
    { name: "Dhruv Jurel", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/4894.png", credits: 7.5 },
    { name: "Ravichandran Ashwin", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/134.png", credits: 8.5 },
    { name: "Trent Boult", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/277.png", credits: 9.0 },
    { name: "Yuzvendra Chahal", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/430.png", credits: 8.5 },
    { name: "Sandeep Sharma", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/442.png", credits: 7.5 },
    { name: "Avesh Khan", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/2756.png", credits: 7.5 },
    { name: "Rovman Powell", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3452.png", credits: 7.5 },
    { name: "Donovan Ferreira", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/5008.png", credits: 7.0 },
    { name: "Nandre Burger", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/5009.png", credits: 7.0 },
    { name: "Tom Kohler-Cadmore", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/5010.png", credits: 7.0 },
  ],
  DC: [
    { name: "Rishabh Pant", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/2739.png", credits: 10.0 },
    { name: "David Warner", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/219.png", credits: 9.5 },
    { name: "Axar Patel", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/429.png", credits: 8.5 },
    { name: "Prithvi Shaw", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3454.png", credits: 8.0 },
    { name: "Tristan Stubbs", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4700.png", credits: 7.5 },
    { name: "Mitchell Marsh", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/280.png", credits: 8.5 },
    { name: "Anrich Nortje", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3460.png", credits: 8.5 },
    { name: "Kuldeep Yadav", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/433.png", credits: 8.5 },
    { name: "Khaleel Ahmed", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3450.png", credits: 7.5 },
    { name: "Ishant Sharma", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/76.png", credits: 7.5 },
    { name: "Mukesh Kumar", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4895.png", credits: 7.0 },
    { name: "Abishek Porel", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/5011.png", credits: 7.0 },
    { name: "Ricky Bhui", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/5012.png", credits: 6.5 },
    { name: "Kumar Kushagra", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/5013.png", credits: 6.5 },
    { name: "Sumit Kumar", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/5014.png", credits: 6.5 },
  ],
  SRH: [
    { name: "Pat Cummins", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/278.png", credits: 9.5 },
    { name: "Travis Head", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3463.png", credits: 9.0 },
    { name: "Heinrich Klaasen", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/3464.png", credits: 9.0 },
    { name: "Abhishek Sharma", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/4462.png", credits: 8.5 },
    { name: "Aiden Markram", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3465.png", credits: 8.0 },
    { name: "Rahul Tripathi", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/2757.png", credits: 8.0 },
    { name: "Abdul Samad", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3807.png", credits: 7.5 },
    { name: "Bhuvneshwar Kumar", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/131.png", credits: 8.5 },
    { name: "T Natarajan", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3458.png", credits: 7.5 },
    { name: "Jaydev Unadkat", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/306.png", credits: 7.5 },
    { name: "Shahbaz Ahmed", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/4463.png", credits: 7.5 },
    { name: "Marco Jansen", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/4467.png", credits: 8.0 },
    { name: "Wanindu Hasaranga", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3462.png", credits: 8.5 },
    { name: "Nitish Kumar Reddy", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/5015.png", credits: 8.0 },
    { name: "Mayank Markande", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3808.png", credits: 7.0 },
  ],
  PBKS: [
    { name: "Shikhar Dhawan", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/41.png", credits: 9.0 },
    { name: "Jonny Bairstow", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/309.png", credits: 8.5 },
    { name: "Liam Livingstone", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3466.png", credits: 8.5 },
    { name: "Sam Curran", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3467.png", credits: 9.0 },
    { name: "Jitesh Sharma", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/4896.png", credits: 7.5 },
    { name: "Prabhsimran Singh", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/3809.png", credits: 7.5 },
    { name: "Arshdeep Singh", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4470.png", credits: 8.5 },
    { name: "Kagiso Rabada", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/2762.png", credits: 9.0 },
    { name: "Rahul Chahar", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3468.png", credits: 7.5 },
    { name: "Harpreet Brar", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/3810.png", credits: 7.0 },
    { name: "Nathan Ellis", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4471.png", credits: 7.5 },
    { name: "Sikandar Raza", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/2763.png", credits: 7.5 },
    { name: "Rilee Rossouw", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/2764.png", credits: 8.0 },
    { name: "Atharva Taide", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/5016.png", credits: 6.5 },
    { name: "Shashank Singh", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4897.png", credits: 7.0 },
  ],
  GT: [
    { name: "Shubman Gill", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3469.png", credits: 9.5 },
    { name: "Wriddhiman Saha", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/133.png", credits: 8.0 },
    { name: "David Miller", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/275.png", credits: 8.5 },
    { name: "Rashid Khan", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/2747.png", credits: 9.5 },
    { name: "Vijay Shankar", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/436.png", credits: 7.5 },
    { name: "Rahul Tewatia", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/2758.png", credits: 8.0 },
    { name: "Mohammed Shami", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/167.png", credits: 9.0 },
    { name: "Mohit Sharma", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/438.png", credits: 8.0 },
    { name: "Umesh Yadav", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/135.png", credits: 7.5 },
    { name: "Noor Ahmad", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/5017.png", credits: 7.5 },
    { name: "Sai Sudharsan", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4898.png", credits: 8.0 },
    { name: "Kane Williamson", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/233.png", credits: 8.5 },
    { name: "Matthew Wade", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/281.png", credits: 7.5 },
    { name: "Darshan Nalkande", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/4472.png", credits: 6.5 },
    { name: "Spencer Johnson", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/5018.png", credits: 7.5 },
  ],
  LSG: [
    { name: "KL Rahul", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/422.png", credits: 10.0 },
    { name: "Quinton de Kock", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/273.png", credits: 9.0 },
    { name: "Nicholas Pooran", role: "wicket_keeper", image_url: "https://scores.iplt20.com/ipl/playerimages/3470.png", credits: 8.5 },
    { name: "Marcus Stoinis", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/326.png", credits: 8.5 },
    { name: "Ayush Badoni", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/4473.png", credits: 7.5 },
    { name: "Deepak Hooda", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/439.png", credits: 8.0 },
    { name: "Krunal Pandya", role: "all_rounder", image_url: "https://scores.iplt20.com/ipl/playerimages/2736.png", credits: 8.0 },
    { name: "Ravi Bishnoi", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3811.png", credits: 8.0 },
    { name: "Mark Wood", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/310.png", credits: 8.5 },
    { name: "Avesh Khan", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/2756.png", credits: 7.5 },
    { name: "Yash Thakur", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/5019.png", credits: 7.0 },
    { name: "Mohsin Khan", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/4474.png", credits: 7.5 },
    { name: "Devdutt Padikkal", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/3812.png", credits: 7.5 },
    { name: "Manan Vohra", role: "batsman", image_url: "https://scores.iplt20.com/ipl/playerimages/440.png", credits: 7.0 },
    { name: "Naveen-ul-Haq", role: "bowler", image_url: "https://scores.iplt20.com/ipl/playerimages/3813.png", credits: 8.0 },
  ],
};

const teamFullNames: Record<string, string> = {
  CSK: "Chennai Super Kings", MI: "Mumbai Indians", RCB: "Royal Challengers Bengaluru",
  KKR: "Kolkata Knight Riders", RR: "Rajasthan Royals", DC: "Delhi Capitals",
  SRH: "Sunrisers Hyderabad", PBKS: "Punjab Kings", GT: "Gujarat Titans", LSG: "Lucknow Super Giants",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { team_short_name, match_id } = await req.json();

    if (!team_short_name || !match_id) {
      return new Response(
        JSON.stringify({ error: "team_short_name and match_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const key = team_short_name.toUpperCase();
    const squad = IPL_SQUADS[key];
    const fullName = teamFullNames[key];

    if (!squad || !fullName) {
      return new Response(
        JSON.stringify({ error: `Unknown team: ${team_short_name}`, available: Object.keys(IPL_SQUADS) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let inserted = 0, skipped = 0;

    for (const p of squad) {
      const { data: existing } = await supabase
        .from("fantasy_players")
        .select("id")
        .eq("match_id", match_id)
        .eq("player_name", p.name)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase.from("fantasy_players")
          .update({ image_url: p.image_url })
          .eq("id", existing[0].id);
        skipped++;
        continue;
      }

      await supabase.from("fantasy_players").insert({
        match_id: match_id,
        player_name: p.name,
        team: fullName,
        role: p.role,
        credits: p.credits,
        image_url: p.image_url,
        is_playing: false,
      });
      inserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        team: fullName,
        players: squad,
        saved: { inserted, skipped, total: squad.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
