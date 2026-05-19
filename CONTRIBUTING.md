# Contributing to Focus Sessions

Thank you for your interest in contributing to Focus Sessions! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive environment for all contributors.

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git
- Docker (optional, for containerized development)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/focus-sessions.git
   cd focus-sessions
   ```

2. **Set up backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Create local environment file**
   ```bash
   cp .env.example .env
   ```

## Development Workflow

### Branch Naming
- Feature: `feature/description`
- Bug fix: `bugfix/description`
- Documentation: `docs/description`

Example: `feature/add-break-mode`, `bugfix/fix-timer-reset`

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic

3. **Run tests**
   ```bash
   # Backend tests
   cd backend
   pytest tests/ -v

   # Frontend tests
   cd frontend
   npm test
   ```

4. **Format code**
   ```bash
   # Backend
   cd backend
   black app/
   isort app/

   # Frontend
   cd frontend
   npm run build  # This includes TypeScript checks
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: describe your changes"
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Changes that don't affect code meaning (formatting, etc.)
- `refactor:` - Code change that doesn't fix a bug or add a feature
- `perf:` - Code change that improves performance
- `test:` - Adding or updating tests
- `chore:` - Changes to build process, dependencies, etc.

Example:
```bash
git commit -m "feat: add break mode timer functionality"
git commit -m "fix: resolve timer reset issue on session completion"
```

## Submitting Changes

### Pull Request Process

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Use the provided PR template
   - Provide clear description of changes
   - Link related issues (e.g., "Fixes #123")
   - Include screenshots for UI changes

3. **Pull Request Title Format**
   - Use the same convention as commit messages
   - Example: `feat: add break mode timer`

### PR Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally (`npm test`, `pytest`)
- [ ] Documentation is updated
- [ ] No breaking changes (or documented in description)
- [ ] Commit messages follow convention
- [ ] Changes are focused and atomic

## Code Style

### Python Backend
- Follow PEP 8
- Use type hints where possible
- Maximum line length: 120 characters
- Use Black for formatting
- Use isort for import ordering

```python
# Good
def get_user_sessions(user_id: int, limit: int = 10) -> list[Session]:
    """Retrieve sessions for a user."""
    return db.query(Session).filter(Session.user_id == user_id).limit(limit).all()

# Avoid
def get_sessions(uid, lim=10):
    return db.query(Session).filter(Session.user_id==uid).limit(lim).all()
```

### TypeScript/React Frontend
- Use TypeScript for type safety
- Follow ESLint configuration
- Use functional components with hooks
- Maximum line length: 100 characters

```typescript
// Good
interface SessionProps {
  sessionId: number;
  duration: number;
  onComplete: (duration: number) => void;
}

export const SessionTimer: React.FC<SessionProps> = ({
  sessionId,
  duration,
  onComplete,
}) => {
  // Implementation
};

// Avoid
export const SessionTimer = (props) => {
  // Implementation
};
```

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_auth.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Adding Tests
- Write tests for new features
- Update tests when fixing bugs
- Aim for >80% code coverage
- Tests should be descriptive and focused

## Documentation

### Code Documentation
- Add docstrings to functions and classes
- Explain complex algorithms
- Include examples for public APIs

```python
def calculate_session_score(
    duration: int,
    interruptions: int,
    task_completion: float
) -> int:
    """
    Calculate productivity score for a session.
    
    Args:
        duration: Session duration in minutes
        interruptions: Number of interruptions
        task_completion: Percentage of tasks completed (0-1)
    
    Returns:
        Productivity score (0-100)
    
    Example:
        >>> calculate_session_score(25, 0, 1.0)
        100
    """
```

### README Updates
- Update README.md if adding new features
- Keep API documentation current
- Document environment variables

## Reporting Issues

### Bug Reports
- Use the bug report template
- Provide minimal reproduction steps
- Include relevant error messages
- Share your environment info

### Feature Requests
- Use the feature request template
- Clearly describe the problem/use case
- Suggest a solution (if you have one)
- Include relevant examples

## Getting Help

- Check existing issues and discussions
- Review documentation in `/docs` folder
- Ask questions in GitHub Discussions
- Contact maintainers for guidance

## Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributors page

Thank you for contributing to Focus Sessions! 🎉
