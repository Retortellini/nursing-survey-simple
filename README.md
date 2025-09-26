# nursing-survey-simple
A nursing task survey to be deployed on Netlify and data stored on Supabase.  Kaiser Nurses and CNA staff should be able to self report their task information so that we can assess their workload and capacity.
# Nursing Workload Survey Platform

A simplified survey platform that collects nursing task time data and feeds it directly into workload simulations.

## 🚀 Quick Start

### 1. File Structure

Create this folder structure in your GitHub repository:

```
nursing-survey-simple/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── lib/
│   │   └── supabase.js
│   └── components/
│       ├── Dashboard.tsx
│       ├── NurseSurvey.tsx
│       ├── CNASurvey.tsx
│       ├── Results.tsx
│       ├── Simulation.tsx
│       └── ui/
│           └── card.tsx
└── README.md
```

### 2. Database Setup (Already Done! ✅)

Your Supabase database is already set up with:
- Survey responses table
- Simulation results table
- Functions for data analysis

### 3. Deploy to Netlify

#### Option A: Connect GitHub Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to your GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click "Deploy"

#### Option B: Drag and Drop (After building locally)

1. Run `npm install` locally
2. Run `npm run build`
3. Drag the `dist` folder to Netlify

### 4. You're Live! 🎉

Your survey platform will be available at:
- `https://tasksurvey.netlify.app/`

## 📋 How to Use

### For Survey Participants

**Share these links:**
- RN Survey: `https://tasksurvey.netlify.app/survey/nurse`
- CNA Survey: `https://tasksurvey.netlify.app/survey/cna`

Can be shared via:
- Email
- QR codes
- Hospital intranet
- Text message

### For Administrators

**View and analyze:**
- Results: `https://tasksurvey.netlify.app/results`
- Simulations: `https://tasksurvey.netlify.app/simulation`

## 🔧 Configuration

No environment variables needed! The Supabase connection is already configured in the code.

## 📊 Features

### ✅ Survey Collection
- Simple nurse and CNA surveys
- Mobile-friendly design
- Anonymous responses
- Progress tracking

### ✅ Data Analysis
- Real-time results viewing
- Filter by role, shift, date
- Visual charts and graphs
- Detailed task breakdowns

### ✅ Workload Simulation
- Monte Carlo simulation
- Multiple staffing ratios
- Task completion rates
- Workload optimization

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Netlify

## 📱 Mobile Support

The survey works perfectly on:
- Desktop browsers
- Tablets
- Mobile phones
- No app download required

## 🔒 Privacy

- No user authentication required
- Anonymous survey responses
- IP addresses are hashed for spam prevention
- No personal identifying information collected

## 🤝 Contributing

To add new features or modify:

1. Clone the repository
2. Make your changes
3. Push to GitHub
4. Netlify auto-deploys!

## 📈 Simulation Details

The simulation uses:
- Survey data to calculate task times
- Monte Carlo methods for probability
- Multiple iterations for accuracy
- Various staffing ratio scenarios

### How It Works:

1. **Data Collection:** Survey responses provide task time ranges
2. **Statistical Analysis:** Mean, standard deviation calculated
3. **Simulation:** Random sampling based on distributions
4. **Output:** Completion rates for different staffing ratios

## 🎯 Roadmap

Future enhancements could include:
- CSV export functionality
- Email notifications
- Custom QR code generation
- Historical trend analysis
- Multi-hospital support

## 📝 License

MIT License - Free to use and modify

## 💡 Support

For questions or issues:
1. Check the GitHub Issues
2. Review Supabase dashboard for data
3. Check Netlify deploy logs

---

## 🚨 Troubleshooting

### Survey Not Submitting
- Check Supabase connection in browser console
- Verify RLS policies are enabled
- Check network tab for API errors

### Simulation Not Running
- Need at least 3 survey responses per task
- Check browser console for errors
- Verify task statistics function exists

### Build Failing on Netlify
- Ensure all dependencies in package.json
- Check build logs for specific errors
- Verify TypeScript configurations

---

Made with ❤️ for better nursing workload management