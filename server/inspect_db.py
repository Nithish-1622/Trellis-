import sqlite3
import pandas as pd
import os

# Database file path
db_path = "career_mentor.db"

if not os.path.exists(db_path):
    print(f"Database file not found at {db_path}")
    exit()

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print(f"=== Database Inspection: {db_path} ===")
    print(f"Found {len(tables)} tables.\n")

    for table in tables:
        table_name = table[0]
        print(f"--- Table: {table_name} ---")
        
        # Get row count
        cursor.execute(f"SELECT count(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"Total Rows: {count}")

        if count > 0:
            # Read first 5 rows into a pandas dataframe for nice printing
            try:
                df = pd.read_sql_query(f"SELECT * FROM {table_name} LIMIT 5", conn)
                print(df.to_string(index=False))
            except Exception as e:
                # Fallback if pandas fails
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
                columns = [description[0] for description in cursor.description]
                print(f"Columns: {columns}")
                rows = cursor.fetchall()
                for row in rows:
                    print(row)
        else:
            print("(Empty Table)")
        
        print("\n" + "="*50 + "\n")

    conn.close()

except Exception as e:
    print(f"Error inspecting database: {e}")
