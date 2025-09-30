import AnimatedShaderBackground from "@/components/ui/animated-shader-background";

const DemoOne = () => {
  return (
    <div className="relative w-full h-screen bg-black">
      <AnimatedShaderBackground />
      
      {/* Example content overlay */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            Animated Shader Background Demo
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md">
            Beautiful aurora-like WebGL shader effect
          </p>
        </div>
      </div>
    </div>
  );
};

export { DemoOne };
export default DemoOne;
