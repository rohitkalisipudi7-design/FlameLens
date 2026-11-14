# FLAMELENS-AI — Microgravity & Partial-Gravity Combustion Science Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Node: 18+](https://img.shields.io/badge/Node-18%2B-green.svg)](https://nodejs.org/)
[![NASA Open Data](https://img.shields.io/badge/Data-NASA%20PSI%20%7C%20NTRS%20%7C%20Task%20Book-red.svg)](https://psi.nasa.gov/)
[![Tests: 91 Passed](https://img.shields.io/badge/Tests-91%20Passed-brightgreen.svg)](tests/)

> **NASA Space Apps Challenge:** *"Flame in Freefall: AI-Powered Fire Safety Insights from Microgravity Combustion Data"*  
> **FLAMELENS-AI** is a comprehensive scientific visualization, machine-learning, and active-learning platform built upon 24 NASA flight investigations, 2,009 microgravity test runs, 277 NASA Technical Reports Server (NTRS) publications, and 138 NASA Task Book research programs.

---

## 🔬 Core Capabilities & Architecture

### 1. Interactive 3D Combustion Laboratory (Three.js & WebGL)
* **Combustion Integrated Rack (CIR) & MDCA Chamber Simulation**: High-fidelity procedural 3D chamber environment replicating the Multi-user Droplet Combustion Apparatus on the International Space Station.
* **Continuous Partial-Gravity Visualizer**: Dynamically scales buoyant deformation, soot trail advection, and droplet flattening across microgravity ($0g$), Lunar gravity ($0.16g$), Martian gravity ($0.38g$), and Earth gravity ($1.0g$).
* **Droplet Burning Lifecycle**: Simulates the classical $d^2$-law ($d^2(t) = d_0^2 - K \cdot t$), ignition transients, hot flame envelope, cool flame transition, and radiative extinction.
* **Instrument Camera Emulation**: Switch between MDCA 4:3 Color Camera, HiBMS Backlit Shadowgraphy, and Low-Light Ultraviolet (LLUV) OH* chemiluminescence modes.

### 2. Machine Learning & Bayesian Active Learning
* **Fuel-Stratified Gaussian Process Regression (GPR)**: Evaluates burning rate constants ($K$) and extinction diameter ratios ($d_{\text{ext}} / d_0$) with anisotropic RBF and observational WhiteKernel noise estimation.
* **Bayesian Expected Information Gain (EIG) Optimizer**: Pointwise Mutual-Information active learning engine targeting high-epistemic-uncertainty candidates to maximize scientific discovery in microgravity:
  $$\text{EIG}(\mathbf{x}) = \frac{1}{2} \log\left(1 + \frac{\sigma_{\text{pred}}^2(\mathbf{x})}{\sigma_n^2}\right)$$
* **Spaceflight Safety Envelopes**: Built-in boundary verification ensuring proposed experimental runs adhere to spacecraft safety limits ($P \le 3.0\text{ atm}$, $X_{\text{O}_2} \le 0.30$) and NASA-STD-6001B flammability standards.

### 3. Evidence Ledger & Contradiction Detection
* **NASA Evidence Ledger**: Unifies 261 droplet points, 1,872 multi-regime test runs, and 24 NASA PSI flight campaigns with immutable source pointers (`source_file`, `source_line`) and official DOIs.
* **Scientific Contradiction Engine**: Identifies physical anomalies, rate discrepancies, and conflicting claims across disparate publications and flight missions.
* **Combustion Video Intelligence**: Calibrated optical tracking of droplet diameter evolution, soot incandescence, and flame extinction dynamics from high-speed spaceflight footage.

---

## 📁 Repository Structure

```
├── app/                  # Frontend Web Application (Vite + Three.js)
│   ├── public/data/      # Precompiled evidence ledgers, GPR models, and summaries
│   ├── src/
│   │   ├── render/       # Three.js 3D Chamber & Flame Shaders
│   │   ├── model/        # Mathematical droplet models & reproducibility checks
│   │   ├── views/        # Lab, Explorer, Optimizer, Safety Envelope, & Video Views
│   │   └── core/         # State store, router, and UI components
│   └── index.html        # Main application entry point
├── data/
│   ├── clean/            # Cleaned, standardized tabular data & data dictionaries
│   ├── ntrs/             # 277 NASA technical papers (PDF + extracted text for RAG)
│   ├── psi/              # NASA Physical Sciences Informatics flight campaign tables
│   ├── standards/        # NASA-STD-6001B and JSC-29353B spaceflight standards
│   ├── taskbook/         # 138 NASA Combustion Science Task Book records
│   └── mechanisms/       # Chemical kinetic mechanisms (GRI-Mech 3.0, San Diego)
├── scripts/              # Reproducible ETL, GPR training, and Bayesian EIG pipelines
│   ├── clean_psi.py      # Multi-regime physical combustion data cleaning
│   ├── experimental_design_optimizer.py  # Active learning & Bayesian EIG
│   ├── safety_envelope_engine.py         # Flammability boundary engine
│   └── combustion_video_intelligence.py   # Droplet tracking & video forensics
├── tests/                # Automated scientific & UI test suite (91 pytest modules)
├── LICENSE               # MIT License
└── README.md             # Project documentation
```

---

## 📊 Dataset Ingestion & Provenance

| Source | Content | Size | Description |
|---|---|---|---|
| **NASA PSI** | 24 Investigations, 20 Matrices | 4.2 GB | Microgravity droplet, gaseous, and solid combustion test runs |
| **NASA NTRS** | 277 Scientific Documents | 818 MB | Full-text technical memoranda, conference papers, and reports |
| **NASA Task Book** | 138 Spaceflight Projects | 4 MB | Research project descriptions, progress, and investigator citations |
| **Standards & Mechanisms** | 3 Standards + 2 Mechanisms | 4 MB | NASA-STD-6001B, JSC-29353B, GRI-Mech 3.0, and San Diego kinetic mechanisms |

* **NASA Open Data License**: All NASA PSI data and NTRS publications are distributed under public domain dedications (CC0 / US Government Public Domain).
* **Data Sanitization**: Zero silent modifications. Every outlier or formatting correction is flagged with explicit reasons in `qc_flags` (detailed in `data/clean/qc_report.md` and `data/clean/data_dictionary.md`).

---

## 🚀 Quickstart & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python**: v3.10.0 or higher
* **npm**: v9.0.0 or higher

### 1. Launch the Interactive 3D Web Dashboard

```bash
# Navigate to the web application directory
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To generate a production build:
```bash
npm run build
```

---

### 2. Python Scientific Pipelines

```bash
# Ingest and clean NASA PSI datasets
python scripts/clean_psi.py

# Run the Bayesian Experimental Design Optimizer
python scripts/experimental_design_optimizer.py

# Evaluate Spaceflight Safety Envelopes
python scripts/safety_envelope_engine.py

# Execute Video Intelligence Droplet Tracking
python scripts/combustion_video_intelligence.py
```

---

## 🧪 Scientific Validation & Testing

The repository contains an automated test suite covering physical models, Gaussian Process Regression, Bayesian EIG calculations, safety boundaries, and 3D visual parameters:

```bash
python -m pytest tests/ -v
```

**Results:** `91 passed in 42.22s (100% passing)`

---

## 📜 Scientific Citation & Acknowledgements

* **NASA Physical Sciences Informatics (PSI)**: Ingests flight observations from FLEX, FLEX-2, BASS, BASS-II, SAFFIRE I–III, ACME (Flame Design, CFI-G, BRE, CLD, E-FIELD, s-Flame), SLICE, SPICE, and SAME.
* **NASA Technical Reports Server (NTRS)**: Microgravity combustion literature published by NASA Glenn Research Center, Johnson Space Center, and collaborating academic institutions.
* **Principal Investigators**: Special recognition to the researchers whose flight investigations enabled this platform, including Forman A. Williams, F.L. Dryer, Mun Y. Choi, Vedha-Nayagam, Sandra L. Olson, David L. Urban, Gary A. Ruff, Mitchell D. Smooke, and C.K. Law.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
NASA datasets and publications are courtesy of the National Aeronautics and Space Administration (NASA).
