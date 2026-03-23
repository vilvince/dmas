// app/client/about/page.tsx
'use client'

import { User } from 'lucide-react'

export default function AboutPage() {
  const developers = [
    {
      name: 'Laurence Lemuel G. Ayo',
      role: 'Full‑Stack Developer',
      description: 'A Bachelor of Science in Information Technology student in Bicol University College of Science, Laurence has a strong foundation in front end designs and systems-level and object-oriented programming. Proficient in C, C++, C#, and Java, he also has skills in web management. He worked on some projects including a Web app POS entitled "Sip&Serve", which he made it all by himself, including front end backend and quality assurance. Despite rigorous projects, he excels at doing projects without delay.',
      image: '/Laurence.png',
    },
    {
      name: 'Vincent N. Naje',
      role: 'Full‑Stack Developer',
      description: 'A Bachelor of Science in Information Technology student from Bicol University College of Science. Proficient in programming languages such as HTML, CSS, JavaScript, Java, C, Dart, and PHP, he has worked on various personal projects including a capstone frontend and backend for Tarami (Albay Dialect Dictionary Mobile App), an E‑commerce for Antique Shop, and a Library Management System using Visual Studio. He enjoys photography, Super Mario games, films, and coding user‑friendly programs. He can be reached through his college‑provided email vnn2022-3190-16409@bicol-u.edu.ph.',
      image: '/Vincent.png',
      
    },
    {
      name: 'Kristel Janne E. Reyes',
      role: 'UI/UX Designer & Front end Developer',
      description: 'A Bachelor of Science in Information Technology student from Bicol University College of Science. A UI/UX Designer and Front-End Developer, she has contributed to various projects including the Tarami (Albay Dialect Dictionary Mobile App), where she worked on designing intuitive user interfaces and enhancing user experience. She is passionate about creating visually appealing and user-friendly digital solutions. Outside of academics, she enjoys drawing and works as a freelance artist, accepting commission-based projects. She can be reached through her college-provided email kjer2022-5849-68094@bicol-u.edu.ph',
      image: '/Kristel.png',
    },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 shrink-0">
        <h1 className="text-xl font-bold text-[#1a2e4a]">About</h1>
        <p className="text-sm text-gray-400 mt-0.5">Meet the team behind this project</p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developers.map((dev, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Avatar / Image */}
                <div className="flex justify-center pt-8 pb-4 bg-gray-50/30">
                  <div className="w-35 h-37 rounded-full bg-white-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={dev.image}
                      alt={dev.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to default icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user text-blue-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 pt-2">
                  <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
                    {dev.name}
                  </h2>
                  {dev.role && (
                    <p className="text-sm text-gray-500 font-medium text-center mb-4">
                      {dev.role}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {dev.description}
                  </p>
                  
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}