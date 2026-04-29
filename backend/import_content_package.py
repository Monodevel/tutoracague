import argparse
from pathlib import Path

from sqlmodel import Session

from app.database import create_db_and_tables, engine
from app.importers.content_package_importer import ContentPackageImporter


def main():
    parser = argparse.ArgumentParser(
        description="Importa un paquete JSON generado por TutorAcague Content Builder."
    )

    parser.add_argument(
        "package_path",
        help="Ruta al archivo acague_generated_package.json",
    )

    args = parser.parse_args()

    package_path = Path(args.package_path)

    create_db_and_tables()

    with Session(engine) as session:
        importer = ContentPackageImporter(session)
        result = importer.import_package(package_path)

    print("Importación completada")
    print(f"Lecciones importadas: {result['lessons']}")
    print(f"Preguntas importadas: {result['questions']}")
    print(f"Opciones importadas: {result['options']}")


if __name__ == "__main__":
    main()