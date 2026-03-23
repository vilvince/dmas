Step 1 — Clone the Repository

git clone https://github.com/yourusername/dmas-system.git
cd dmas-system

Step 2 — Install Dependencies

npm install

Step 3 — Set Up Environment Variables
Create a .env.local file in the root of the project:

In windows (PowerShell/terminal) type this

New-Item -ItemType File -Force -Path ".env.local"

Then open .env.local and paste the following yung naka pin sa gc.

Step 4 — Run the Development Server

npm run dev
