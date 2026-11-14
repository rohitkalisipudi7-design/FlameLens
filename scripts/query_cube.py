"""CLI tool for querying and exploring the integrated NASA OLAP Warehouse.

Queries authentic empirical records across:
- NASA PSI: standardized microgravity physical experiment runs
- NASA NTRS: full-text technical papers with complete citation metadata
- NASA Task Book: flight projects and investigator milestones
- Standards: NASA-STD-6001B certification thresholds

Usage:
    python scripts/query_cube.py
    python scripts/query_cube.py "SELECT material_or_fuel, title, AVG(burning_rate_mm2_s) FROM ... "
"""
import os
import sqlite3
import sys
import pandas as pd

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "olap_experimentos.db")


def main():
    if not os.path.exists(DB_PATH):
        print(f"Database does not exist yet. Please execute first: python scripts/build_olap_cube.py")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 1000)

    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"\nExecuting SQL: {query}\n")
        try:
            df = pd.read_sql_query(query, conn)
            print(df.to_string(index=False))
        except Exception as e:
            print(f"Query error: {e}")
        return

    print("=" * 95)
    print("      ANALYTICAL OLAP QUERIES: PSI + NTRS + TASK BOOK + STANDARDS")
    print("=" * 95)
    print("1. Experiments with full NTRS paper title and research citation")
    print("2. OLAP Roll-up: Material and oxygen level aggregation (burning rates & extinction)")
    print("3. Saffire flight tests (SIBAL, Silicone, PMMA) mapped to NASA-STD-6001B standard")
    print("4. Búsqueda en los 277 Papers de NTRS por Tema y Centro de la NASA")
    print("5. Proyectos de NASA Task Book en la ISS y sus Investigadores Principales")
    print("=" * 95)

    queries = {
        "1. Ensayos con TÍTULO COMPLETO DEL PAPER NTRS": """
            SELECT 
                v.id_experimento       AS [ID],
                v.fase_mision          AS [Misión],
                v.nombre_material      AS [Material],
                v.oxigeno_percent      AS [O2 %],
                v.tasa_propagacion_avg AS [Tasa],
                v.id_paper             AS [ID NTRS],
                v.titulo_paper         AS [Título Completo del Paper Documentado]
            FROM v_cubo_experimentos_completo v
            WHERE v.tasa_propagacion_avg IS NOT NULL
            ORDER BY v.id_experimento ASC
            LIMIT 8;
        """,
        "2. Roll-up OLAP: Material x Oxígeno": """
            SELECT 
                nombre_material,
                oxigeno_percent AS [O2 %],
                total_ensayos AS [Total Pruebas],
                presion_avg_psi AS [P Media (PSI)],
                tasa_propagacion_avg AS [Tasa Media],
                temp_max_pico AS [Temp Pico (°C)],
                tiempo_autoext_avg AS [Autoext (s)]
            FROM v_cubo_resumen_materiales
            WHERE total_ensayos >= 5
            ORDER BY total_ensayos DESC, [O2 %] DESC
            LIMIT 10;
        """,
        "3. Saffire vs NASA-STD-6001B (Silicona vs SIBAL vs PMMA)": """
            SELECT 
                v.fase_mision AS [Misión],
                v.nombre_material AS [Material],
                v.oxigeno_percent AS [O2 %],
                v.tiempo_autoextincion AS [Tiempo Quemado (s)],
                v.codigo_estandar AS [Estándar Aplicado],
                SUBSTR(v.criterio_aprobacion, 1, 48) || '...' AS [Criterio Certificación],
                v.titulo_paper AS [Paper NTRS que lo Reporta]
            FROM v_cubo_experimentos_completo v
            WHERE v.fase_mision LIKE '%Cygnus%' OR v.nombre_material LIKE '%Silicone%'
            LIMIT 8;
        """,
        "4. Muestra de Papers de NTRS por Tema": """
            SELECT 
                id_paper AS [ID NTRS],
                SUBSTR(titulo_paper, 1, 55) || '...' AS [Título del Paper],
                autores AS [Autores],
                anio_publicacion AS [Año],
                tema_investigacion AS [Tema],
                centro_nasa AS [Centro NASA]
            FROM dim_paper_ntrs
            WHERE tema_investigacion IN ('saffire', 'flex', 'bass', 'droplet_coolflame')
            ORDER BY anio_publicacion DESC
            LIMIT 8;
        """,
        "5. Proyectos Financiados en NASA Task Book (Combustion Science)": """
            SELECT 
                SUBSTR(id_proyecto, 1, 8) AS [TaskID],
                SUBSTR(titulo_proyecto, 1, 42) || '...' AS [Título del Proyecto],
                investigador_principal AS [Investigador Principal],
                afiliacion AS [Institución],
                programa_vuelo AS [Programa],
                centro_responsable AS [Centro]
            FROM fact_proyecto_taskbook
            WHERE programa_vuelo IN ('ISS', 'Shuttle', 'Shuttle/ISS')
            LIMIT 8;
        """
    }

    for opt, q in queries.items():
        print(f"\n>>> [RESULTADO: {opt}]")
        df = pd.read_sql_query(q, conn)
        print(df.to_string(index=False))


if __name__ == "__main__":
    main()
