#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quill-be-proj.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

# app/management/commands/renameproject.py

import os
import glob
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Renames the Project'

    def add_arguments(self, parser):
        parser.add_argument('old', nargs='+', type=str, help="current project name")
        parser.add_argument('new', nargs='+', type=str, help="new project name")

    def handle(self, *args, **options):
        old = options["old"][0]
        new = options["new"][0]

        base = str(settings.BASE_DIR)
        projectfiles = []
        managefile = os.path.join(base, "manage.py")
        projectfiles.append(managefile)
        projectfiles += glob.glob(os.path.join(base, old, "*.py"))
        projectfiles += glob.glob(os.path.join(base, old, "**", "*.py"))
        for pythonfile in projectfiles:
            with open(pythonfile, 'r') as file:
                filedata = file.read()

            filedata = filedata.replace(old, new)

            with open(pythonfile, 'w') as file:
                file.write(filedata)
        os.rename(os.path.join(base, old), os.path.join(base, new))

if __name__ == '__main__':
    main()
