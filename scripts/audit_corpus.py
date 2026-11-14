"""Script de auditoría exhaustiva de datos para Flame in Freefall V4.
Verifica todos los conteos, archivos y esquemas antes de iniciar las modificaciones de V4.
"""
import csv
import glob
import json
import os
import sqlite3
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CLEAN_DIR = os.path.join(DATA_DIR, "clean")
PSI_DIR = os.path.join(DATA_DIR, "psi")
DB_PATH = os.path.join(DATA_DIR, "olap_experimentos.db")
NTRS_CATALOG = os.path.join(DATA_DIR, "ntrs", "catalog.csv")
TASKBOOK_CSV = os.path.join(DATA_DIR, "taskbook", "taskbook_combustion.csv")

def audit():
    report = {}

    # 1. Cleaned tables
    clean_counts = {}
    for f in glob.glob(os.path.join(CLEAN_DIR, "*.csv")):
        name = os.path.basename(f)
        try:
            df = pd.read_csv(f, low_memory=False)
            clean_counts[name] = len(df)
        except Exception as e:
            clean_counts[name] = f"Error: {e}"
    report["clean_tables"] = clean_counts

    # 2. OLAP DB
    olap_counts = {}
    if os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        for t in tables:
            olap_counts[t] = c.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
        views = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='view'").fetchall()]
        report["olap_views"] = views
    report["olap_tables"] = olap_counts

    # 3. NTRS Catalog
    if os.path.exists(NTRS_CATALOG):
        df_ntrs = pd.read_csv(NTRS_CATALOG)
        report["ntrs_records"] = len(df_ntrs)
    else:
        report["ntrs_records"] = 0

    # 4. Task Book
    if os.path.exists(TASKBOOK_CSV):
        df_tb = pd.read_csv(TASKBOOK_CSV)
        report["taskbook_records"] = len(df_tb)
    else:
        report["taskbook_records"] = 0

    # 5. PSI Campaigns
    psi_index = os.path.join(PSI_DIR, "psi_index.csv")
    if os.path.exists(psi_index):
        df_psi = pd.read_csv(psi_index)
        report["psi_campaigns"] = len(df_psi)
    else:
        report["psi_campaigns"] = 0

    # 6. Quality flags breakdown
    if "experiments_all.csv" in clean_counts:
        exp_all = pd.read_csv(os.path.join(CLEAN_DIR, "experiments_all.csv"), low_memory=False)
        flag_series = exp_all["qc_flags"].dropna().str.split("; ")
        all_flags = [f for sub in flag_series for f in sub if f]
        flag_freq = pd.Series(all_flags).value_counts().to_dict()
        report["quality_flags_total"] = len(all_flags)
        report["quality_flags_frequency"] = flag_freq
        report["excluded_rows"] = int(exp_all["excluded"].fillna(False).sum())
        report["total_experimental_rows"] = len(exp_all)

    print(json.dumps(report, indent=2))
    return report

if __name__ == "__main__":
    audit()

