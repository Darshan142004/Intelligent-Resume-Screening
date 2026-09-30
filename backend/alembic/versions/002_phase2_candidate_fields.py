"""Add Phase 2 candidate fields (raw_text, projects, certifications, languages)

Revision ID: 002_phase2_candidate_fields
Revises: 001_initial_schema
Create Date: 2026-09-30

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_phase2_candidate_fields'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('candidates', sa.Column('projects', sa.Text(), nullable=True))
    op.add_column('candidates', sa.Column('certifications', sa.Text(), nullable=True))
    op.add_column('candidates', sa.Column('languages', sa.Text(), nullable=True))
    op.add_column('candidates', sa.Column('raw_text', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('candidates', 'raw_text')
    op.drop_column('candidates', 'languages')
    op.drop_column('candidates', 'certifications')
    op.drop_column('candidates', 'projects')
